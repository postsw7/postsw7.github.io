module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2021: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: [
    'dist/',
    '.vite/',
    'node_modules/',
    'public/jgrep/',
    'v1/',
  ],
  overrides: [
    {
      files: ['**/*.test.*', '**/__tests__/**'],
      env: { jest: true },
      extends: ['plugin:testing-library/react', 'plugin:jest-dom/recommended'],
      rules: {
        'no-console': 'off',
        'no-restricted-properties': [
          'error',
          { object: 'describe', property: 'only', message: 'Remove .only from tests' },
          { object: 'it', property: 'only', message: 'Remove .only from tests' },
          { object: 'test', property: 'only', message: 'Remove .only from tests' },
        ],
      },
    },
    {
      files: ['scripts/**', '*.config.*', 'vite.config.*', 'vitest.setup.*'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      },
    },
  ],
}
