# Truck Finance Manager

App mobile-first para gerenciar as finanças de caminhões: registrar despesas (compras, serviços e pagamentos, cada um com tags personalizáveis), registrar faturamento, e acompanhar receitas/despesas/lucro por período com gráficos e histórico de transações.

- **Frontend**: React 19 + TypeScript + Vite, publicado no GitHub Pages.
- **Backend**: Firebase (Authentication por e-mail/senha + Firestore). Não há servidor próprio.
- **UI**: [Mantine](https://mantine.dev) (componentes, modais de confirmação, toasts, gráfico donut).

## Rodando localmente

O projeto usa o **Firebase Local Emulator Suite** em desenvolvimento — não é necessário ter um projeto Firebase real para rodar e testar o app localmente.

```bash
npm install

# Terminal 1: emuladores do Firebase (Auth + Firestore)
npx firebase emulators:start

# Terminal 2: servidor de desenvolvimento
npm run dev
```

Acesse o app em `http://localhost:5173` e o painel dos emuladores em `http://localhost:4000`. O arquivo `.env` já vem com valores de demonstração (`demo-truck-finance`) que funcionam apenas com os emuladores — nunca use esses valores em produção.

## Publicando em produção

### 1. Criar o projeto Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Em **Authentication → Sign-in method**, ative o provedor **E-mail/senha**.
3. Em **Firestore Database**, crie o banco (modo produção).
4. Em **Configurações do projeto → Geral → Seus apps**, crie um app da Web e copie as credenciais (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### 2. Publicar as regras e índices do Firestore

Isso é manual e separado do deploy do frontend — o GitHub Actions só publica os arquivos estáticos, nunca as regras/índices do Firestore:

```bash
npx firebase login
npx firebase use --add   # selecione o projeto real criado no passo 1
npx firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Configurar o GitHub Pages

Em **Settings → Pages** do repositório, defina **Source: GitHub Actions**.

### 4. Configurar os secrets do repositório

Em **Settings → Secrets and variables → Actions**, adicione os secrets abaixo com os valores copiados no passo 1 (mesmos nomes usados em `.env.example`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Um push para `main` dispara o workflow em `.github/workflows/deploy.yml`, que builda o app com esses secrets e publica `dist/` no GitHub Pages.

> A configuração do Firebase embutida no bundle publicado não é um segredo — qualquer pessoa pode vê-la inspecionando o app. A proteção real dos dados vem das regras do Firestore (`firestore.rules`), que garantem que cada usuário autenticado só acessa os próprios dados.

## Estrutura de dados (Firestore)

```
users/{uid}
users/{uid}/vehicles/{vehicleId}
users/{uid}/tags/{tagId}
users/{uid}/vehicles/{vehicleId}/transactions/{transactionId}
```

Cada usuário só enxerga seus próprios dados (`firestore.rules`). Tags são compartilhadas entre todos os caminhões do usuário; transações guardam um "retrato" do nome da tag no momento do registro, então renomear ou excluir uma tag não afeta o histórico.
