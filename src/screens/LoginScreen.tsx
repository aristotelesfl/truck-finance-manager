import { useState } from 'react'
import { Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Link } from 'react-router-dom'
import { resetPassword, signIn } from '../firebase/auth'
import { firebaseErrorMessage } from '../utils/firebaseErrors'

interface LoginValues {
  email: string
  password: string
}

export function LoginScreen() {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) => (value.length > 0 ? null : 'Informe sua senha'),
    },
  })

  const handleSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    const email = form.values.email
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      form.setFieldError('email', 'Informe seu e-mail para recuperar a senha')
      return
    }
    try {
      await resetPassword(email)
      notifications.show({ message: 'E-mail de redefinição de senha enviado.', color: 'green' })
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    }
  }

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <Stack gap="md">
          <div>
            <Title order={2}>Truck Finance</Title>
            <Text c="dimmed" size="sm">
              Entre para gerenciar as finanças dos seus caminhões
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="E-mail"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              <Anchor size="sm" component="button" type="button" onClick={handleForgotPassword}>
                Esqueci minha senha
              </Anchor>
              <Button type="submit" loading={submitting} fullWidth mt="sm">
                Entrar
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Não tem conta?{' '}
            <Anchor component={Link} to="/signup">
              Cadastre-se
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  )
}
