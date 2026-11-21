import { useState, type Dispatch, type SetStateAction } from 'react'
import { MAX_PRACTICE_FIELD_CHARS, clampPracticeText } from '@/lib/validation/practice-input'
import { getInitials } from '../config/setup-config'
import type { SavedProfile } from '../types/setup-types'
import { ProfileDeleteModal } from './profile-delete-modal'

function ScrollableText({ text }: { text: string }) {
  return (
    <div className="relative max-h-[7.5em] overflow-y-auto custom-scrollbar">
      <p className="typo-body leading-[1.6] text-[var(--brand-gray-600)]">{text}</p>
    </div>
  )
}

type ProfilesLibraryTabProps = {
  savedProfiles: SavedProfile[]
  editingProfile: SavedProfile | null
  setEditingProfile: Dispatch<SetStateAction<SavedProfile | null>>
  onSaveProfile: (profile: SavedProfile) => void
  onDeleteProfile: (profileId: string) => void
  errorMessage?: string | null
  onGoToSetup: () => void
}

export function ProfilesLibraryTab({
  savedProfiles,
  editingProfile,
  setEditingProfile,
  onSaveProfile,
  onDeleteProfile,
  errorMessage,
  onGoToSetup,
}: ProfilesLibraryTabProps) {
  const [profileToDelete, setProfileToDelete] = useState<SavedProfile | null>(null)

  return (
    <>
      <section
        className={`flex flex-1 overflow-auto bg-[var(--brand-light-50)] p-6 ${
          savedProfiles.length === 0 ? 'items-center justify-center' : 'justify-center'
        }`}
      >
        <div className={`w-full ${savedProfiles.length === 0 ? 'max-w-md' : 'max-w-5xl'} pt-2`}>
        {errorMessage && (
          <p role="alert" className="typo-body mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {errorMessage}
          </p>
        )}
        {savedProfiles.length === 0 ? (
          <div className="setup-reveal flex flex-col items-center text-center">
            <div className="mb-6 grid h-24 w-24 place-items-center rounded-full border-[8px] border-white bg-[var(--brand-mist-100)] shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-10 w-10 text-[var(--brand-blue-600)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6" />
                <path d="M22 11h-6" />
              </svg>
            </div>
            <h2 className="typo-page-title mb-3 font-bold text-[var(--brand-ink-900)]">Aún no tienes perfiles</h2>
            <p className="typo-body mx-auto mb-8 max-w-[340px] text-balance text-[var(--brand-gray-600)]">
              Los perfiles se guardan de forma automática cada vez que inicias una nueva simulación con un cliente diferente.
            </p>
            <button
              onClick={onGoToSetup}
              className="typo-body dropdown-animation-reveal flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink-900)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-ink-800)]"
            >
              Crear mi primera simulación
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="setup-reveal w-full text-left">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="typo-page-title font-bold text-[var(--brand-ink-900)]">Librería de Perfiles</h2>
                <p className="typo-body mt-2 text-[var(--brand-gray-600)]">
                  Gestiona los perfiles de tus clientes para entrenar escenarios a medida rápida y sencillamente.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {savedProfiles.map((profile) => {
                const displayTitle = profile.name
                let displayRole = profile.roleCompany

                if (!displayRole && profile.prospect) {
                  const parts = profile.prospect.split(',')

                  if (parts.length > 1) {
                    displayRole = parts[1].trim().split('.')[0]
                  }
                }

                const isEditing = editingProfile?.id === profile.id
                const initials = getInitials(displayTitle)

                return (
                  <article
                    key={profile.id}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 transition-all ${
                      isEditing
                        ? 'border-[var(--brand-blue-400)] shadow-md ring-4 ring-[var(--brand-blue-50)]'
                        : 'border-[var(--brand-gray-200)] shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    <div className="mb-4 flex items-start gap-4">
                      <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-[var(--brand-mist-100)] text-[19px] font-bold text-[var(--brand-blue-600)]">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingProfile.name}
                            onChange={(event) =>
                              setEditingProfile({ ...editingProfile, name: event.target.value })
                            }
                            className="mb-1 w-full border-b border-[var(--brand-blue-200)] bg-transparent pb-0.5 text-[17px] font-bold leading-tight text-[var(--brand-ink-900)] outline-none transition-colors focus:border-[var(--brand-blue-500)]"
                            placeholder="Nombre del prospecto"
                          />
                        ) : (
                          <h3 className="typo-body truncate text-[17px] font-bold leading-tight text-[var(--brand-ink-900)] transition-colors group-hover:text-[var(--brand-blue-600)]">
                            {displayTitle}
                          </h3>
                        )}

                        {isEditing ? (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5 shrink-0 text-[var(--brand-gray-400)]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                            <input
                              type="text"
                              value={editingProfile.roleCompany || ''}
                              onChange={(event) =>
                                setEditingProfile({ ...editingProfile, roleCompany: event.target.value })
                              }
                              className="w-full border-b border-transparent bg-transparent pb-0.5 text-[13px] font-medium text-[var(--brand-gray-600)] outline-none transition-colors hover:border-[var(--brand-gray-200)] focus:border-[var(--brand-blue-400)]"
                              placeholder="Rol o empresa (opcional)"
                            />
                          </div>
                        ) : (
                          displayRole && (
                            <p className="typo-micro mt-1.5 line-clamp-1 flex items-center gap-1.5 font-medium text-[var(--brand-gray-500)]">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 shrink-0 text-[var(--brand-gray-400)]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                              {displayRole}
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mb-2 mt-1 flex-1">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <textarea
                            rows={5}
                            value={editingProfile.prospect}
                            maxLength={MAX_PRACTICE_FIELD_CHARS}
                            onChange={(event) =>
                              setEditingProfile({
                                ...editingProfile,
                                prospect: clampPracticeText(event.target.value),
                              })
                            }
                            className="custom-scrollbar typo-body w-full resize-none rounded-lg border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-2.5 leading-[1.6] text-[var(--brand-gray-700)] outline-none transition-colors focus:border-[var(--brand-blue-400)]"
                            placeholder="Describe el contexto o los retos de este cliente..."
                          />
                          <p
                            className={`typo-caption text-right ${
                              editingProfile.prospect.length > MAX_PRACTICE_FIELD_CHARS * 0.9
                                ? 'text-[var(--color-danger-text)]'
                                : 'text-[var(--brand-gray-500)]'
                            }`}
                          >
                            {editingProfile.prospect.length}/{MAX_PRACTICE_FIELD_CHARS}
                          </p>
                        </div>
                      ) : (
                        <ScrollableText text={profile.prospect} />
                      )}
                    </div>

                    <div
                      className={`mt-5 flex items-center justify-between border-t border-[var(--brand-gray-100)] pt-4 transition-opacity ${
                        isEditing ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <span className="text-[13px] font-medium text-[var(--brand-gray-500)]">
                            Usado: {profile.createdAt}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                setEditingProfile(null)
                              }}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-500)] transition-colors hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-ink-900)]"
                              title="Cancelar"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-[15px] w-[15px]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                onSaveProfile(editingProfile)
                                setEditingProfile(null)
                              }}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--brand-blue-600)] bg-[var(--brand-blue-600)] text-white shadow-sm transition-colors hover:border-[var(--brand-blue-700)] hover:bg-[var(--brand-blue-700)]"
                              title="Guardar"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-[15px] w-[15px]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[13px] font-medium text-[var(--brand-gray-500)]">
                            Usado: {profile.createdAt}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                setProfileToDelete(profile)
                              }}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-400)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                              title="Eliminar"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-[15px] w-[15px]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                setTimeout(() => setEditingProfile({ ...profile, roleCompany: displayRole }), 0)
                              }}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-600)] transition-colors hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-ink-900)]"
                              title="Editar"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-[15px] w-[15px]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </section>

      {profileToDelete && (
        <ProfileDeleteModal
          profileName={profileToDelete.name}
          onCancel={() => setProfileToDelete(null)}
          onConfirm={() => {
            onDeleteProfile(profileToDelete.id)
            setProfileToDelete(null)
          }}
        />
      )}
    </>
  )
}
