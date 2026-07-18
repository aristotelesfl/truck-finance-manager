import { useState } from 'react'
import { Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Link } from 'react-router-dom'
import { signUp } from '../firebase/auth'
import { ensureUserBootstrap } from '../firebase/firestore'
import { firebaseErrorMessage } from '../utils/firebaseErrors'

interface SignupValues {
  email: string
  password: string
  confirmPassword: string
}

export function SignupScreen() {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignupValues>({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) => (value.length >= 6 ? null : 'A senha precisa ter pelo menos 6 caracteres'),
      confirmPassword: (value, values) => (value === values.password ? null : 'As senhas não coincidem'),
    },
  })

  const handleSubmit = async (values: SignupValues) => {
    setSubmitting(true)
    try {
      const credential = await signUp(values.email, values.password)
      await ensureUserBootstrap(credential.user.uid)
      notifications.show({ message: 'Conta criada com sucesso!', color: 'green' })
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" w="100%" maw={400}>
        <Stack gap="md">
          <div>
            <Title order={2}>Criar conta</Title>
            <Text c="dimmed" size="sm">
              Comece a organizar as finanças dos seus caminhões
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
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Confirmar senha"
                placeholder="Repita a senha"
                autoComplete="new-password"
                {...form.getInputProps('confirmPassword')}
              />
              <Button type="submit" loading={submitting} fullWidth mt="sm">
                Criar conta
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Já tem conta?{' '}
            <Anchor component={Link} to="/login">
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  )
}
