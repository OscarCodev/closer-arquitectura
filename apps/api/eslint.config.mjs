import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Regla de Clean Architecture: el dominio no depende de frameworks ni de infraestructura.
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/modules/*/domain/**/*.ts', 'src/shared/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*', '@prisma/*', 'ioredis', '@google/genai'], message: 'El dominio no puede depender de frameworks ni proveedores.' },
            { group: ['**/infrastructure/**', '**/presentation/**', '**/application/**'], message: 'El dominio no depende de capas externas.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/*/application/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@prisma/*', 'ioredis', '@google/genai'], message: 'La capa de aplicación usa puertos, no proveedores concretos.' },
            { group: ['**/infrastructure/**', '**/presentation/**'], message: 'La aplicación no depende de infraestructura ni presentación.' },
          ],
        },
      ],
    },
  },
)
