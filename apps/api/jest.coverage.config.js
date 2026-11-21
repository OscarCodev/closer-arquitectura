/**
 * Reporte de cobertura combinado: pruebas unitarias + pruebas de integración (requiere Docker).
 * Uso: npm run test:cov:all  →  coverage/index.html
 */
const unit = require('./jest.config.js')
const integration = require('./test/jest-integration.config.js')

/** Opciones que Jest solo acepta a nivel global, no dentro de cada proyecto. */
const projectOnly = ({ coverageReporters, coverageDirectory, collectCoverageFrom, testTimeout, ...rest }) => rest // eslint-disable-line no-unused-vars

module.exports = {
  projects: [
    { ...projectOnly(unit), displayName: 'unitarias' },
    { ...projectOnly(integration), rootDir: __dirname, displayName: 'integración' },
  ],
  testTimeout: 30000,
  collectCoverageFrom: unit.collectCoverageFrom,
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: { global: { lines: 80, statements: 80, functions: 75, branches: 65 } },
}
