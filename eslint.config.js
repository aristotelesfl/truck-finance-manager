import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Realtime Firestore subscriptions legitimately flip a loading flag
      // synchronously before/around an async listener attaches; this rule
      // is tuned for React Compiler edge cases we don't hit here.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/contexts/**/*.tsx'],
    rules: {
      // These files intentionally co-export a Provider component and its
      // matching `useX` hook — Fast Refresh just falls back to a full
      // reload for them, which is fine.
      'react-refresh/only-export-components': 'off',
    },
  },
])
