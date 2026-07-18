import { useState } from 'react'
import { Button, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useTags } from '../hooks/useTags'
import { useAuth } from '../contexts/AuthContext'
import { createTag } from '../firebase/firestore'
import { firebaseErrorMessage } from '../utils/firebaseErrors'
import type { ExpenseType } from '../types'

const NEW_TAG_VALUE = '__new__'

interface TagPickerProps {
  expenseType: ExpenseType
  value: string | null
  onChange: (tagId: string, tagName: string) => void
  error?: string
}

function NewTagForm({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm({
    initialValues: { name: '' },
    validate: { name: (v) => (v.trim() ? null : 'Informe um nome') },
  })

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        setSubmitting(true)
        try {
          await onSubmit(values.name.trim())
        } finally {
          setSubmitting(false)
        }
      })}
    >
      <Stack gap="sm">
        <TextInput label="Nome da tag" placeholder="Ex: Filtro de óleo" data-autofocus {...form.getInputProps('name')} />
        <Button type="submit" loading={submitting} fullWidth>
          Criar
        </Button>
      </Stack>
    </form>
  )
}

export function TagPicker({ expenseType, value, onChange, error }: TagPickerProps) {
  const { user } = useAuth()
  const { tags } = useTags(expenseType)

  const data = [...tags.map((t) => ({ value: t.id, label: t.name })), { value: NEW_TAG_VALUE, label: '+ Nova tag' }]

  const openNewTagModal = () => {
    const modalId = 'new-tag-modal'
    modals.open({
      modalId,
      title: 'Nova tag',
      children: (
        <NewTagForm
          onSubmit={async (name) => {
            if (!user) return
            try {
              const newId = await createTag(user.uid, { name, expenseType })
              onChange(newId, name)
              notifications.show({ message: 'Tag criada.', color: 'green' })
              modals.close(modalId)
            } catch (err) {
              notifications.show({ message: firebaseErrorMessage(err), color: 'red' })
            }
          }}
        />
      ),
    })
  }

  return (
    <Select
      label="Tag"
      placeholder="Selecione uma tag"
      data={data}
      value={value}
      error={error}
      searchable
      onChange={(selected) => {
        if (!selected) return
        if (selected === NEW_TAG_VALUE) {
          openNewTagModal()
          return
        }
        const tag = tags.find((t) => t.id === selected)
        if (tag) onChange(tag.id, tag.name)
      }}
    />
  )
}
