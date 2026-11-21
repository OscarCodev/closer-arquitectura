import Link from "next/link"
import { routes } from "@/lib/routes"
import { AppIcon } from "@/components/brand/app-icon"

export const metadata = {
  title: "Términos y Condiciones — Closer AI",
  description: "Términos y condiciones de uso de Closer AI. Conoce las reglas del servicio.",
}

export default function TermsPage() {
  const lastUpdated = "12 de abril de 2026"

  return (
    <div className="min-h-screen bg-[var(--brand-light-50)] text-[var(--brand-ink-900)]">
      {/* Header */}
      <header className="border-b border-[var(--brand-gray-100)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link href={routes.home} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <AppIcon size={30} />
            <span className="font-semibold text-[var(--brand-ink-800)]">Closer</span>
          </Link>
          <Link href={routes.home} className="text-sm font-medium text-[var(--brand-gray-500)] hover:text-[var(--brand-ink-900)] transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-ink-900)] mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-[var(--brand-gray-500)] mb-12">Última actualización: {lastUpdated}</p>

        <div className="space-y-10 text-[var(--brand-gray-700)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder o utilizar Closer AI (&quot;el Servicio&quot;), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">2. Descripción del servicio</h2>
            <p>
              Closer AI es una plataforma de entrenamiento de habilidades de venta que utiliza inteligencia artificial para simular conversaciones con clientes virtuales. El Servicio incluye simulaciones de voz, análisis de rendimiento, retroalimentación personalizada y seguimiento de progreso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">3. Registro y cuenta</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Debes proporcionar información precisa y completa al crear tu cuenta.</li>
              <li>Eres responsable de mantener la seguridad y confidencialidad de tu cuenta.</li>
              <li>Debes tener al menos 18 años para usar el Servicio.</li>
              <li>Una cuenta es personal e intransferible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">4. Uso aceptable</h2>
            <p className="mb-3">Al utilizar Closer AI, te comprometes a:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Usar el Servicio únicamente para fines de entrenamiento y desarrollo profesional legítimos.</li>
              <li>No intentar dañar, deshabilitar o comprometer la integridad de la plataforma.</li>
              <li>No utilizar el Servicio para generar contenido abusivo, difamatorio u ofensivo.</li>
              <li>No realizar ingeniería inversa ni intentar acceder a nuestros modelos de IA de manera no autorizada.</li>
              <li>No compartir tu cuenta ni tus credenciales de acceso con terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">5. Propiedad intelectual</h2>
            <p>
              Todo el contenido, diseño, código, modelos de IA, algoritmos y materiales del Servicio son propiedad exclusiva de Closer AI y están protegidos por las leyes de propiedad intelectual. No se te concede ningún derecho de propiedad sobre el Servicio más allá de la licencia limitada de uso personal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">6. Contenido generado por el usuario</h2>
            <p>
              Los datos generados durante tus simulaciones (grabaciones de voz, respuestas y métricas) te pertenecen. Al usar el Servicio, nos otorgas una licencia limitada para procesar estos datos con el fin de proporcionarte retroalimentación, mejorar tu experiencia y optimizar nuestros modelos de IA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">7. Disponibilidad del servicio</h2>
            <p>
              Nos esforzamos por mantener el Servicio disponible de manera continua, pero no garantizamos que esté libre de interrupciones, errores o fallos. Podemos modificar, suspender o descontinuar cualquier parte del Servicio con previo aviso razonable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">8. Limitación de responsabilidad</h2>
            <p>
              Closer AI se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos que el uso del Servicio resulte en mejoras específicas en tus ventas o resultados comerciales. En ningún caso nuestra responsabilidad excederá el monto que hayas pagado por el Servicio en los últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">9. Cancelación</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.</li>
              <li>Tras la cancelación, tus datos serán eliminados según lo establecido en nuestra <Link href={routes.privacy} className="text-[var(--brand-blue-600)] underline hover:text-[var(--brand-blue-700)]">Política de Privacidad</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">10. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados con al menos 30 días de anticipación. El uso continuado del Servicio después de cualquier modificación constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos términos, puedes contactarnos en <a href="mailto:legal@closer.ai" className="text-[var(--brand-blue-600)] underline hover:text-[var(--brand-blue-700)]">legal@closer.ai</a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--brand-gray-100)] py-8 text-center">
        <p className="text-xs text-[var(--brand-gray-500)]">© {new Date().getFullYear()} Closer AI. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
