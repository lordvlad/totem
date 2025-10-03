import love from 'eslint-config-love'

export default [
  {
    ...love,
    files: ['**/*.js', '**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      ...love.rules,
      "promise/avoid-new": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/prefer-destructuring": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-magic-numbers": "off",
    }
  },
]
