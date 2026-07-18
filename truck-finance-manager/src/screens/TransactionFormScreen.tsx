import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Textarea,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconTrash } from '@tabler/icons-react'
import { format, parse } from 'date-fns'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TagPicker } from '../components/TagPicker'
import { useAuth } from '../contexts/AuthContext'
import { useVehicle } from '../contexts/VehicleContext'
import { createTransaction, deleteTransaction, getTransaction, updateTransaction } from '../firebase/firestore'
import { centsToNumber, numberToCents } from '../utils/currency'
import { firebaseErrorMessage } from '../utils/firebaseErrors'
import { EXPENSE_TYPE_LABELS } from '../types'
import type { ExpenseType, TransactionKind } from '../types'

const DATE_FORMAT = 'yyyy-MM-dd'

interface FormValues {
  expenseType: ExpenseType
  tagId: string | null
  tagName: string | null
  value: number | ''
  date: Date | null
  description: string
}

const EXPENSE_TYPE_OPTIONS = (Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map((key) => ({
  value: key,
  label: EXPENSE_TYPE_LABELS[key],
}))

export function TransactionFormScreen() {
  const { user } = useAuth()
  const { activeVehicleId } = useVehicle()
  const navigate = useNavigate()
  const { id: transactionId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(transactionId)
  const kindFromQuery = (searchParams.get('kind') as TransactionKind | null) ?? 'despesa'

  const [kind, setKind] = useState<TransactionKind>(kindFromQuery)
  const [loadingTransaction, setLoadingTransaction] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const form = useForm<FormValues>({
    initialValues: {
      expenseType: 'compra',
      tagId: null,
      tagName: null,
      value: '',
      date: new Date(),
      description: '',
    },
    validate: {
      value: (v) => (typeof v === 'number' && v > 0 ? null : 'Informe um valor maior que zero'),
      date: (v) => (v ? null : 'Informe a data'),
    },
  })

  useEffect(() => {
    if (!isEditing || !user || !activeVehicleId || !transactionId) return
    setLoadingTransaction(true)
    getTransaction(user.uid, activeVehicleId, transactionId)
      .then((transaction) => {
        if (!transaction) {
          setNotFound(true)
          return
        }
        setKind(transaction.kind)
        form.setValues({
          expenseType: transaction.expenseType ?? 'compra',
          tagId: transaction.tagId ?? null,
          tagName: transaction.tagName ?? null,
          value: centsToNumber(transaction.valueCents),
          date: parse(transaction.date, DATE_FORMAT, new Date()),
          description: transaction.description,
        })
      })
      .finally(() => setLoadingTransaction(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, user, activeVehicleId, transactionId])

  if (!activeVehicleId) {
    return <Navigate to="/vehicles" replace />
  }

  const handleSubmit = async (values: FormValues) => {
    if (!user || typeof values.value !== 'number' || !values.date) return
    if (kind === 'despesa' && !values.tagId) {
      form.setFieldError('tagId', 'Selecione uma tag')
      return
    }
    setSubmitting(true)
    try {
      const input = {
        kind,
        expenseType: kind === 'despesa' ? values.expenseType : undefined,
        tagId: kind === 'despesa' ? (values.tagId ?? undefined) : undefined,
        tagName: kind === 'despesa' ? (values.tagName ?? undefined) : undefined,
        valueCents: numberToCents(values.value),
        date: format(values.date, DATE_FORMAT),
        description: values.description.trim(),
      }
      if (isEditing && transactionId) {
        await updateTransaction(user.uid, activeVehicleId, transactionId, input)
        notifications.show({ message: 'Transação atualizada.', color: 'green' })
      } else {
        await createTransaction(user.uid, activeVehicleId, input)
        notifications.show({ message: kind === 'despesa' ? 'Despesa registrada.' : 'Receita registrada.', color: 'green' })
      }
      navigate('/')
    } catch (error) {
      notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!transactionId) return
    modals.openConfirmModal({
      title: 'Excluir transação',
      children: <>Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.</>,
      labels: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        if (!user) return
        try {
          await deleteTransaction(user.uid, activeVehicleId, transactionId)
          notifications.show({ message: 'Transação excluída.', color: 'green' })
          navigate('/')
        } catch (error) {
          notifications.show({ message: firebaseErrorMessage(error), color: 'red' })
        }
      },
    })
  }

  if (notFound) {
    return <Navigate to="/" replace />
  }

  const title = isEditing
    ? kind === 'despesa'
      ? 'Editar despesa'
      : 'Editar receita'
    : kind === 'despesa'
      ? 'Cadastrar despesa'
      : 'Cadastrar faturamento'

  return (
    <Stack gap="md" p="md" maw={480} mx="auto">
      <Group gap="xs">
        <ActionIcon variant="subtle" onClick={() => navigate(-1)} aria-label="Voltar">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Title order={3}>{title}</Title>
      </Group>

      {loadingTransaction ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            {kind === 'despesa' && (
              <>
                <Select
                  label="Tipo"
                  data={EXPENSE_TYPE_OPTIONS}
                  value={form.values.expenseType}
                  onChange={(v) => {
                    if (!v) return
                    form.setFieldValue('expenseType', v as ExpenseType)
                    form.setFieldValue('tagId', null)
                    form.setFieldValue('tagName', null)
                  }}
                  allowDeselect={false}
                />
                <TagPicker
                  expenseType={form.values.expenseType}
                  value={form.values.tagId}
                  error={form.errors.tagId as string | undefined}
                  onChange={(tagId, tagName) => {
                    form.setFieldValue('tagId', tagId)
                    form.setFieldValue('tagName', tagName)
                  }}
                />
              </>
            )}

            <NumberInput
              label="Valor"
              placeholder="0,00"
              prefix="R$ "
              decimalSeparator=","
              thousandSeparator="."
              decimalScale={2}
              fixedDecimalScale
              min={0}
              {...form.getInputProps('value')}
            />

            <DateInput
              label={kind === 'despesa' ? 'Data da compra' : 'Data'}
              valueFormat="DD/MM/YYYY"
              {...form.getInputProps('date')}
            />

            <Textarea
              label="Descrição"
              placeholder="Detalhes sobre esta transação"
              minRows={4}
              {...form.getInputProps('description')}
            />

            <Button type="submit" loading={submitting} fullWidth mt="sm">
              Salvar
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
              >
                Excluir
              </Button>
            )}
          </Stack>
        </form>
      )}
    </Stack>
  )
}
