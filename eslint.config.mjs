export default [
  {
    files: ['index.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        document: 'readonly',
        fetch: 'readonly',
        Image: 'readonly',
      },
    },
    rules: {
      eqeqeq: 'error',
      'no-redeclare': 'error',
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
