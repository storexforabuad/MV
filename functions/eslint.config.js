
// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    globals: {
        process: 'readonly',
        console: 'readonly'
    },
  },
  ignores: ['lib', 'node_modules'],
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  rules: {
    ...eslint.configs.recommended.rules,
    ...tseslint.configs.recommended.rules,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'quotes': ['error', 'single'],
  },
});
