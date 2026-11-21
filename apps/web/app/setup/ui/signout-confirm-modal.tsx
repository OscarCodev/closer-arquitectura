type SignOutConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export function SignOutConfirmModal({ onCancel, onConfirm, loading }: SignOutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(10,10,10,0.4)] backdrop-blur-[2px] transition-opacity"
        onClick={onCancel}
      />
      <div className="modal-reveal relative w-full max-w-sm rounded-[24px] border border-[var(--brand-gray-200)] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-light-200)] text-[var(--brand-gray-600)]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[var(--brand-ink-900)]">¿Cerrar sesión?</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--brand-gray-600)]">
            Vas a salir de tu cuenta actual. Podrás volver a entrar cuando quieras.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 text-sm font-bold text-[var(--brand-gray-600)] transition-all hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-gray-800)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[var(--brand-ink-900)] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-ink-800)] hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
