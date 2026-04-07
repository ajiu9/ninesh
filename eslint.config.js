import ajiu9 from '@ajiu9/eslint-config'

export default ajiu9({
  ignores: [
    'docs/**',
    '**/*.md',
    'package-lock.json',
  ],
}, {
  rules: {
    'no-console': ['error', { allow: ['log', 'error'] }],
  },
})
