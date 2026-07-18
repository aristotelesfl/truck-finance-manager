import { FirebaseError } from 'firebase/app'

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
}

export function firebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? 'Ocorreu um erro. Tente novamente.'
  }
  return 'Ocorreu um erro. Tente novamente.'
}
