import { useState } from 'react'
import { ActionIcon, Button, Card, Group, Modal, Stack, Tabs, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useTags } from '../hooks/useTags'
import { createTag, deleteTag, updateTag } from '../firebase/firestore'
import { firebaseErrorMessage } from '../utils/firebaseErrors'
import { EXPENSE_TYPE_LABELS } from '../types'
import type { ExpenseType, Tag } from '../types'

const EXPENSE_TYPES: ExpenseType[] = ['compra', 'servico', 'pagamento']

export function TagsScreen() {
  const { user } = useAuth()
  const [activeType, setActiveType] = useState<ExpenseType>('compra')
  const { tags, loading } = useTags(activeType)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({ initialValues: { name: '' }, validate: { name: (v) => (v.trim() ? null : 'Informe um nome') } })

  const openCreateModal = () => {
    setEditingTag(null)
    form.setValues({ name: '' })
    setModalOpen(true)
  }

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag)
    form.setValues({ name: tag.name })
    setModalOpen(true)
  }

  const handleSubmit = async (values: { name: string }) => {
    if (!user) return
    setSubmitting(true)
    try {
      const name = values.name.trim()
      if (editingTag) {
        await updateTag(user.uid, editingTag.id, name)
        notifications.show({ message: 'Tag atualizada.', color: 'green' })
      } else {
        await createTag(user.uid, { name, expenseType: activeType })
        notifications.show({ message: 'Tag criada.', color: 'green' })
      }
      setModalOpen(false)
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (tag: Tag) => {
    modals.openConfirmModal({
      title: 'Excluir tag',
      children: (
        <Text size="sm">
          Excluir a tag <b>{tag.name}</b>? Transações já registradas com ela mantêm o nome
          salvo, mas ela deixará de aparecer para novos registros.
        </Text>
      ),
      labels: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        if (!user) return
        try {
          await deleteTag(user.uid, tag.id)
          notifications.show({ message: 'Tag excluída.', color: 'green' })
        } catch (error) {
          notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
        }
      },
    })
  }

  return (
    <Stack gap="md" pb="md">
      <Title order={3}>Tags</Title>

      <Tabs value={activeType} onChange={(value) => value && setActiveType(value as ExpenseType)}>
        <Tabs.List grow>
          {EXPENSE_TYPES.map((type) => (
            <Tabs.Tab key={type} value={type}>
              {EXPENSE_TYPE_LABELS[type]}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {EXPENSE_TYPES.map((type) => (
          <Tabs.Panel key={type} value={type} pt="md">
            <Stack gap="sm">
              <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal} variant="light">
                Nova tag
              </Button>
              {!loading && tags.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  Nenhuma tag cadastrada ainda.
                </Text>
              )}
              {tags.map((tag) => (
                <Card key={tag.id} withBorder radius="md" padding="sm">
                  <Group justify="space-between">
                    <Text>{tag.name}</Text>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" onClick={() => openEditModal(tag)} aria-label="Renomear">
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(tag)} aria-label="Excluir">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingTag ? 'Renomear tag' : 'Nova tag'}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Nome" placeholder="Ex: Filtro de óleo" {...form.getInputProps('name')} />
            <Button type="submit" loading={submitting} fullWidth mt="sm">
              Salvar
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
