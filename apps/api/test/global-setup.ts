import { execSync } from 'node:child_process'

/**
 * Antes de todas las pruebas: aplica las migraciones pendientes al esquema `integration`
 * (no destructivo). Cada ejecución usa usuarios nuevos, así los datos anteriores no interfieren.
 */
export default async function globalSetup() {
  await import('./integration-env')
  execSync('npx prisma migrate deploy', { cwd: `${__dirname}/..`, env: process.env, stdio: 'ignore' })
}
