import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  nodePlugin.configs['flat/recommended-script'],
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': 'error',
    },
    ignores: [
      '!.*', // unignore dot files
    ],
  },
  {
    files: ['**/*.test.js'],
    rules: {
      'n/no-unpublished-import': 0,
    },
  },
];
