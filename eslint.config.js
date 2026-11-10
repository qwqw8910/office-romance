import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report', '.taste-skill'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // TypeScript 已檢查未定義變數
      'no-undef': 'off',
    },
  },
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['vue', 'pinia', 'pixi.js', '../ui/*', '../scenes/*', '../stores/*'] },
      ],
    },
  },
  prettier,
]
