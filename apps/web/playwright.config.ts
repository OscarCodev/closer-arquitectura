import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas End to End: navegador real contra la web (Next.js) y la API (NestJS).
 * Modo sin costo: login de desarrollo, IA simulada (AI_PROVIDER=fake) y voz con guion (NEXT_PUBLIC_VOICE_MODE=mock).
 * Si la web y la API ya están corriendo se reutilizan; si no, Playwright las levanta.
 */
const WEB_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  // En CI se usan los builds de producción (sin compilación bajo demanda); en local, los servidores de desarrollo.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: process.env.CI ? 'node dist/main.js' : 'npm run start:dev',
          cwd: '../api',
          url: 'http://127.0.0.1:4000/api/v1/health/live',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: process.env.CI ? 'npm run start' : 'npm run dev',
          url: WEB_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
})
