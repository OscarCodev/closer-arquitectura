/**
 * Pruebas de integración: API completa (NestJS) + PostgreSQL + Redis reales.
 * Requiere `npm run infra:up`. Usa el esquema `integration` de Postgres y la base 1 de Redis,
 * así no toca los datos de desarrollo.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.integration-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/global-setup.ts',
  setupFiles: ['<rootDir>/test/integration-env.ts', '<rootDir>/src/test-support/silence-logs.ts'],
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/test-support/**', '!src/**/*.spec.ts'],
  coverageDirectory: 'coverage-integration',
}
