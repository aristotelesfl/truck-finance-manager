import { ActionIcon, AppShell as MantineAppShell, Group, Text, UnstyledButton, Stack } from '@mantine/core'
import { IconLogout, IconTags, IconTruck, IconHome2, IconHistory } from '@tabler/icons-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { logOut } from '../../firebase/auth'

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: IconHome2 },
  { to: '/historico', label: 'Histórico', icon: IconHistory },
  { to: '/vehicles', label: 'Veículos', icon: IconTruck },
  { to: '/tags', label: 'Tags', icon: IconTags },
]

export function AppShellLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    modals.openConfirmModal({
      title: 'Sair da conta',
      children: <Text size="sm">Tem certeza que deseja sair?</Text>,
      labels: { confirm: 'Sair', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await logOut()
        notifications.show({ message: 'Você saiu da sua conta.', color: 'blue' })
      },
    })
  }

  return (
    <MantineAppShell header={{ height: 56 }} footer={{ height: 68 }} padding="md">
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700}>Truck Finance</Text>
          <ActionIcon variant="subtle" color="gray" onClick={handleLogout} aria-label="Sair">
            <IconLogout size={20} />
          </ActionIcon>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>

      <MantineAppShell.Footer>
        <Group h="100%" grow px="xs">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to
            const Icon = item.icon
            return (
              <UnstyledButton key={item.to} onClick={() => navigate(item.to)} h="100%">
                <Stack align="center" gap={2} justify="center" h="100%">
                  <Icon size={22} color={active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)'} />
                  <Text size="xs" c={active ? 'blue' : 'dimmed'}>
                    {item.label}
                  </Text>
                </Stack>
              </UnstyledButton>
            )
          })}
        </Group>
      </MantineAppShell.Footer>
    </MantineAppShell>
  )
}
