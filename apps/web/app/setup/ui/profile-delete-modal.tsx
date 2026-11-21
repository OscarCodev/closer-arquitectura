type ProfileDeleteModalProps = {
  profileName: string
  onCancel: () => void
  onConfirm: () => void
}

export function ProfileDeleteModal({ profileName, onCancel, onConfirm }: ProfileDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(10,10,10,0.4)] backdrop-blur-[2px] transition-opacity"
        onClick={onCancel}
      />
      <div className="modal-reveal relative w-full max-w-sm rounded-[24px] border border-[var(--brand-gray-200)] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[var(--brand-ink-900)]">¿Eliminar perfil?</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--brand-gray-600)]">
            Esta acción borrará permanentemente el perfil{' '}
            <span className="font-bold text-[var(--brand-gray-800)]">&quot;{profileName}&quot;</span>. No podrás
            deshacerlo.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 text-sm font-bold text-[var(--brand-gray-600)] transition-all hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-gray-800)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}