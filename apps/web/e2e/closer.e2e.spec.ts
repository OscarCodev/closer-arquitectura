import { expect, test } from '@playwright/test'
import { completeOnboarding, loginWithEmail, signInReadyUser, startPracticeFromForm, talkAndHangUp, uniqueEmail } from './helpers'

test.describe('Acceso y onboarding (SPEC-01)', () => {
  test('sin sesión, /setup redirige al login (CA-01.1)', async ({ page }) => {
    await page.goto('/setup')
    await expect(page).toHaveURL(/\/iniciar-sesion/)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })

  test('usuario nuevo: login → onboarding de 5 pasos → /setup; al volver a entrar va directo (CA-01.2, CA-01.3)', async ({ page }) => {
    const email = uniqueEmail('onboarding')
    await loginWithEmail(page, email)
    await completeOnboarding(page, 'Lucía')
    await expect(page).toHaveURL(/\/setup$/, { timeout: 30_000 })
    await expect(page.getByText('Lucía').first()).toBeVisible()

    await page.evaluate(() => localStorage.removeItem('closer.dev-session.v1'))
    await loginWithEmail(page, email)
    await expect(page).toHaveURL(/\/setup$/, { timeout: 30_000 })
  })
})

test.describe('Práctica de punta a punta (SPEC-03 a SPEC-06)', () => {
  test('autogenerar → llamada → coach → evaluación → reintento → historial', async ({ page }) => {
    test.setTimeout(240_000) // dos llamadas completas con sus pantallas de carga
    await signInReadyUser(page, uniqueEmail('practica'))
    await startPracticeFromForm(page)

    // Coach: se pide cuando el prospecto terminó su turno (CA-04.6).
    const coach = page.getByTitle('Pedir consejo para tu siguiente respuesta')
    await expect(coach).toBeEnabled({ timeout: 30_000 })
    await page.waitForTimeout(700)
    await coach.click()
    await expect(page.getByText('Consejo', { exact: true })).toBeVisible()

    await talkAndHangUp(page, 6)

    // Resultado calculado por el servidor (CA-05.1).
    await expect(page.getByText(/precisión de la venta/i)).toBeVisible()
    await expect(page.getByText(/\d+ turnos/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Reintentar/ })).toBeVisible()

    // Reintento en la misma sesión (CA-06.3).
    await page.getByRole('button', { name: /Reintentar/ }).click()
    await expect(page).toHaveURL(/\/simulation$/, { timeout: 60_000 })
    await talkAndHangUp(page, 10)
    await expect(page.getByText(/^de 2$/i)).toBeVisible()

    // Historial: la sesión aparece con su puntaje y el título sugerido (CA-06.1, CA-05.8).
    await page.getByText('Volver al Menú').click()
    await expect(page).toHaveURL(/\/setup/)
    await expect(page.getByText(/\d+\/100/).first()).toBeVisible()
  })

  test('el prospecto de una práctica queda en la biblioteca y se puede eliminar (CA-02.1, CA-02.4)', async ({ page }) => {
    await signInReadyUser(page, uniqueEmail('biblioteca'))
    await startPracticeFromForm(page)
    await talkAndHangUp(page, 8)

    await page.getByText('Volver al Menú').click()
    await page.getByRole('button', { name: 'Perfiles' }).click()
    await expect(page.getByText('Librería de Perfiles')).toBeVisible()
    const cards = page.locator('article')
    await expect(cards).toHaveCount(1)

    await page.getByTitle('Eliminar').click()
    await page.getByRole('button', { name: /Eliminar/ }).last().click()
    await expect(cards).toHaveCount(0)

    await page.reload()
    await page.getByRole('button', { name: 'Perfiles' }).click()
    await expect(page.locator('article')).toHaveCount(0)
  })
})
