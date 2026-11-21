import { NotFoundError } from '../shared/domain/errors'
import { InMemoryCache } from '../test-support/fakes'
import { AuthenticateUseCase } from './identity/application/authenticate.use-case'
import { GetOnboardingUseCase, onboardingCacheKey, SaveOnboardingUseCase } from './identity/application/onboarding.use-cases'
import type { UserRepositoryPort } from './identity/application/ports'
import type { ProfileRepositoryPort } from './profiles/application/ports'
import { CreateProfileUseCase, DeleteProfileUseCase, ListProfilesUseCase, profilesCacheKey, UpdateProfileUseCase } from './profiles/application/profiles.use-cases'
import type { ProspectProfile, ProspectProfileInput } from './profiles/domain/prospect-profile'
import { SendSupportContactUseCase, type SupportNotifierPort, type SupportRepositoryPort } from './support/application/send-support-contact.use-case'

class InMemoryProfiles implements ProfileRepositoryPort {
  rows: Array<ProspectProfile & { userId: string }> = []
  async listByUser(userId: string) {
    return this.rows.filter((r) => r.userId === userId)
  }
  async findById(userId: string, id: string) {
    return this.rows.find((r) => r.userId === userId && r.id === id) ?? null
  }
  async create(userId: string, input: ProspectProfileInput) {
    const row = { ...input, id: `p${this.rows.length + 1}`, userId, createdAt: new Date(), updatedAt: new Date() }
    this.rows.push(row)
    return row
  }
  async update(userId: string, id: string, input: ProspectProfileInput) {
    const row = await this.findById(userId, id)
    if (!row) return null
    Object.assign(row, input, { updatedAt: new Date() })
    return row
  }
  async delete(userId: string, id: string) {
    const before = this.rows.length
    this.rows = this.rows.filter((r) => !(r.userId === userId && r.id === id))
    return this.rows.length < before
  }
}

describe('Prospectos (SPEC-02)', () => {
  const build = () => ({ repo: new InMemoryProfiles(), cache: new InMemoryCache() })

  it('crear guarda e invalida la caché de la biblioteca (CA-02.1)', async () => {
    const { repo, cache } = build()
    await cache.set(profilesCacheKey('a'), [], 60)
    const created = await new CreateProfileUseCase(repo, cache).execute('a', { prospect: 'Ana Torres, Head of Sales', context: 'ctx' })
    expect(created.name).toBe('Ana Torres, Head of Sales')
    expect(cache.store.has(profilesCacheKey('a'))).toBe(false)
  })

  it('listar usa la caché y devuelve fechas reales', async () => {
    const { repo, cache } = build()
    await new CreateProfileUseCase(repo, cache).execute('a', { prospect: 'Ana', context: '' })
    const spy = jest.spyOn(repo, 'listByUser')
    const list = new ListProfilesUseCase(repo, cache)
    await list.execute('a')
    const second = await list.execute('a')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(second[0].createdAt).toBeInstanceOf(Date)
  })

  it('editar conserva los campos no enviados (CA-02.3)', async () => {
    const { repo, cache } = build()
    const created = await new CreateProfileUseCase(repo, cache).execute('a', { prospect: 'Ana Torres', context: 'Vendo X', roleCompany: 'CFO en Y' })
    const updated = await new UpdateProfileUseCase(repo, cache).execute('a', created.id, { name: 'Ana T.' })
    expect(updated).toMatchObject({ name: 'Ana T.', context: 'Vendo X', roleCompany: 'CFO en Y' })
  })

  it('otro usuario no puede editar ni borrar (CA-02.5)', async () => {
    const { repo, cache } = build()
    const created = await new CreateProfileUseCase(repo, cache).execute('a', { prospect: 'Ana', context: '' })
    await expect(new UpdateProfileUseCase(repo, cache).execute('b', created.id, { name: 'x' })).rejects.toThrow(NotFoundError)
    await expect(new DeleteProfileUseCase(repo, cache).execute('b', created.id)).rejects.toThrow(NotFoundError)
    expect(repo.rows).toHaveLength(1)
  })
})

describe('Identidad (SPEC-01)', () => {
  const users = (): UserRepositoryPort & { upserts: number; saved: unknown } => {
    let stored: { answers: never; completedAt: Date } | null = null
    return {
      upserts: 0,
      saved: null,
      async upsert() {
        this.upserts++
      },
      async findOnboarding() {
        return stored
      },
      async saveOnboarding(_userId, answers) {
        stored = { answers: answers as never, completedAt: new Date() }
        return stored
      },
    }
  }

  it('registra al usuario solo la primera vez (marca en caché)', async () => {
    const repo = users()
    const verifier = { verify: async () => ({ id: 'u1', email: 'a@b.c' }) }
    const useCase = new AuthenticateUseCase(verifier, repo, new InMemoryCache())
    await useCase.execute('t')
    await useCase.execute('t')
    expect(repo.upserts).toBe(1)
  })

  it('el onboarding guardado se ve inmediatamente: guardar invalida la caché (CA-01.5)', async () => {
    const repo = users()
    const cache = new InMemoryCache()
    const get = new GetOnboardingUseCase(repo, cache)
    expect(await get.execute('u1')).toBeNull()
    expect(cache.store.get(onboardingCacheKey('u1'))).toBe('{"none":true}')

    await new SaveOnboardingUseCase(repo, cache).execute('u1', { firstName: 'Lucía' })
    const after = await get.execute('u1')
    expect(after?.answers.firstName).toBe('Lucía')
    expect(after?.completedAt).toBeInstanceOf(Date)
  })
})

describe('Soporte (SPEC-07)', () => {
  const repo = (): SupportRepositoryPort & { saved: number } => ({
    saved: 0,
    async save() {
      this.saved++
    },
  })

  it('si el webhook falla, el mensaje igual queda guardado (CA-07.3)', async () => {
    const store = repo()
    const notifier: SupportNotifierPort = { notify: async () => Promise.reject(new Error('500')) }
    const result = await new SendSupportContactUseCase(store, notifier).execute({ id: 'u', email: null }, { subject: 'Hola', message: 'No escucho audio' })
    expect(result).toEqual({ delivered: false })
    expect(store.saved).toBe(1)
  })

  it('con webhook disponible informa delivered=true (CA-07.2)', async () => {
    const notifier: SupportNotifierPort = { notify: async () => true }
    await expect(
      new SendSupportContactUseCase(repo(), notifier).execute({ id: 'u', email: null }, { subject: 'Hola', message: 'No escucho audio' }),
    ).resolves.toEqual({ delivered: true })
  })
})
