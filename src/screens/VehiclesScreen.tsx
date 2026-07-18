import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Card,
  Center,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconTruck } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { useVehicle } from '../contexts/VehicleContext'
import { createVehicle, deleteVehicleCascade, updateVehicle } from '../firebase/firestore'
import { firebaseErrorMessage } from '../utils/firebaseErrors'
import type { Vehicle } from '../types'

interface VehicleFormValues {
  plate: string
  nickname: string
}

export function VehiclesScreen() {
  const { user } = useAuth()
  const { vehicles, loading, activeVehicleId, setActiveVehicleId } = useVehicle()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<VehicleFormValues>({
    initialValues: { plate: '', nickname: '' },
    validate: {
      plate: (value) => (value.trim().length > 0 ? null : 'Informe a placa'),
    },
  })

  const openCreateModal = () => {
    setEditingVehicle(null)
    form.setValues({ plate: '', nickname: '' })
    setModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    form.setValues({ plate: vehicle.plate, nickname: vehicle.nickname ?? '' })
    setModalOpen(true)
  }

  const handleSubmit = async (values: VehicleFormValues) => {
    if (!user) return
    setSubmitting(true)
    try {
      const plate = values.plate.trim().toUpperCase()
      const nickname = values.nickname.trim() || undefined
      if (editingVehicle) {
        await updateVehicle(user.uid, editingVehicle.id, { plate, nickname })
        notifications.show({ message: 'Caminhão atualizado.', color: 'green' })
      } else {
        const id = await createVehicle(user.uid, { plate, nickname })
        setActiveVehicleId(id)
        notifications.show({ message: 'Caminhão cadastrado.', color: 'green' })
      }
      setModalOpen(false)
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (vehicle: Vehicle) => {
    modals.openConfirmModal({
      title: 'Excluir caminhão',
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir o caminhão <b>{vehicle.plate}</b>? Todas as despesas e
          receitas registradas para ele também serão excluídas. Essa ação não pode ser desfeita.
        </Text>
      ),
      labels: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        if (!user) return
        try {
          await deleteVehicleCascade(user.uid, vehicle.id)
          notifications.show({ message: 'Caminhão excluído.', color: 'green' })
        } catch (error) {
          notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
        }
      },
    })
  }

  return (
    <Stack gap="md" pb="md">
      <Group justify="space-between">
        <Title order={3}>Meus caminhões</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          Novo
        </Button>
      </Group>

      {!loading && vehicles.length === 0 && (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconTruck size={40} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" ta="center">
              Você ainda não cadastrou nenhum caminhão.
            </Text>
            <Button onClick={openCreateModal} mt="sm">
              Cadastrar meu primeiro caminhão
            </Button>
          </Stack>
        </Center>
      )}

      <Stack gap="sm">
        {vehicles.map((vehicle) => {
          const active = vehicle.id === activeVehicleId
          return (
            <Card key={vehicle.id} withBorder radius="md" padding="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2} style={{ flex: 1, cursor: 'pointer' }} onClick={() => setActiveVehicleId(vehicle.id)}>
                  <Group gap="xs">
                    <Text fw={600}>{vehicle.plate}</Text>
                    {active && <IconCheck size={16} color="var(--mantine-color-blue-6)" />}
                  </Group>
                  {vehicle.nickname && (
                    <Text size="sm" c="dimmed">
                      {vehicle.nickname}
                    </Text>
                  )}
                </Stack>
                <Group gap={4}>
                  <ActionIcon variant="subtle" onClick={() => openEditModal(vehicle)} aria-label="Editar">
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(vehicle)} aria-label="Excluir">
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          )
        })}
      </Stack>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editingVehicle ? 'Editar caminhão' : 'Novo caminhão'}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput label="Placa" placeholder="ABC1D23" {...form.getInputProps('plate')} />
            <TextInput label="Apelido (opcional)" placeholder="Ex: Caminhão vermelho" {...form.getInputProps('nickname')} />
            <Button type="submit" loading={submitting} fullWidth mt="sm">
              Salvar
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
