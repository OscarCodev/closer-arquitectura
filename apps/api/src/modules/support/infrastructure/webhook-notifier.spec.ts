import type { AppConfig } from '../../../shared/infrastructure/config/app-config.service'
import { WebhookSupportNotifier } from './support.adapters'

const configWith = (url: string) => ({ get: () => url }) as unknown as AppConfig
const contact = { subject: 'Ayuda', message: 'No escucho el audio', pagePath: '/simulation' }
const user = { id: 'u1', email: 'a@b.c' }

describe('WebhookSupportNotifier (CA-07.2, CA-07.3)', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('sin URL configurada no envía nada', async () => {
    global.fetch = jest.fn()
    await expect(new WebhookSupportNotifier(configWith('')).notify(user, contact)).resolves.toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('envía usuario, asunto, mensaje y ruta al webhook', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    await expect(new WebhookSupportNotifier(configWith('https://hooks.test/x')).notify(user, contact)).resolves.toBe(true)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('https://hooks.test/x')
    expect(JSON.parse(init.body)).toMatchObject({ user, contact, type: 'support-contact' })
  })

  it('si el webhook responde error, lo informa como excepción', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(new WebhookSupportNotifier(configWith('https://hooks.test/x')).notify(user, contact)).rejects.toThrow('HTTP 500')
  })
})
