import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Variables y código no usado
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],

      // Debugging - advertir sobre console.log en producción
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Mejores prácticas
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'no-duplicate-imports': 'error',

      // React específico
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
