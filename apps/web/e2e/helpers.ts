import { expect, type Page } from '@playwright/test'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1'

/** Correo único por prueba: cada prueba empieza con un usuario nuevo. */
export const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@closer.test`

/** Login por la interfaz con enlace por correo (en modo desarrollo pedir el enlace equivale a abrirlo). */
export async function loginWithEmail(page: Page, email: string) {
  await page.goto('/iniciar-sesion')
  await page.getByPlaceholder('ejemplo@correo.com').fill(email)
  await page.getByRole('button', { name: 'Enviar enlace de acceso' }).click()
}

/** Completa los 5 pasos del onboarding por la interfaz. */
export async function completeOnboarding(page: Page, firstName: string) {
  // En modo desarrollo Next compila la página la primera vez: se da margen.
  await expect(page).toHaveURL(/\/setup\/onboarding/, { timeout: 60_000 })
  await page.getByPlaceholder('Escribe tu nombre').fill(firstName)
  await page.getByText('1-3 años', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()

  await page.getByText('Vendedor o closer', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()

  await page.getByText('Tecnología / Software', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()

  await page.getByText('Pymes con equipo directivo', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()

  await page.getByText('Manejar objeciones de precio', { exact: true }).click()
  await page.getByRole('button', { name: 'Empezar ahora' }).click()
}

/** Usuario listo para practicar, creado por la API (más rápido que recorrer el onboarding). */
export async function signInReadyUser(page: Page, email: string) {
  const res = await page.request.post(`${API_URL}/auth/dev-token`, { data: { email } })
  const { accessToken, userId, expiresIn } = await res.json()
  await page.request.put(`${API_URL}/me/onboarding`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { firstName: 'Vendedora E2E', role: 'Vendedor o closer', industry: 'Tecnología / Software' },
  })
  await page.goto('/iniciar-sesion')
  await page.evaluate(
    ([token, id, mail, ttl]) =>
      localStorage.setItem(
        'closer.dev-session.v1',
        JSON.stringify({
          access_token: token,
          expiresAt: Date.now() + Number(ttl) * 1000 - 30_000,
          user: { id, email: mail, app_metadata: { provider: 'email' }, user_metadata: {} },
        }),
      ),
    [accessToken, userId, email, String(expiresIn)],
  )
  await page.goto('/setup')
  await expect(page.getByRole('heading', { name: 'Preparación de venta' })).toBeVisible()
}

/** Llena el formulario de práctica y pulsa Iniciar; espera a que la llamada esté en curso. */
export async function startPracticeFromForm(page: Page) {
  await page.getByRole('button', { name: 'Autogenerar escenario' }).click()
  await expect(page.getByRole('textbox', { name: 'Contexto' })).not.toHaveValue('')
  await expect(page.getByRole('textbox', { name: 'Perfil' })).not.toHaveValue('')
  await page.getByRole('button', { name: 'Iniciar' }).click()
  await expect(page).toHaveURL(/\/simulation$/, { timeout: 60_000 })
  await expect(page.getByText('EN VIVO')).toBeVisible()
}

/** Espera unos intercambios del guion simulado y cuelga. */
export async function talkAndHangUp(page: Page, seconds = 12) {
  await page.waitForTimeout(seconds * 1000)
  await page.getByTitle('Finalizar llamada').click()
  await expect(page).toHaveURL(/\/simulation\/result$/, { timeout: 60_000 })
}
