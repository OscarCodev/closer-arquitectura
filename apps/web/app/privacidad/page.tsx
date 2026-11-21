import Link from "next/link"
import { routes } from "@/lib/routes"
import { AppIcon } from "@/components/brand/app-icon"

export const metadata = {
  title: "Política de Privacidad — Closer AI",
  description: "Política de privacidad de Closer AI. Conoce cómo recopilamos, usamos y protegemos tu información.",
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-ink-900)] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-[var(--brand-gray-500)] mb-12">Última actualización: {lastUpdated}</p>

        <div className="space-y-10 text-[var(--brand-gray-700)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">1. Información que recopilamos</h2>
            <p className="mb-3">
              Closer AI recopila información que tú nos proporcionas directamente al crear una cuenta y usar nuestros servicios. Esto incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y método de autenticación.</li>
              <li><strong>Datos de uso:</strong> grabaciones de voz durante las simulaciones, resultados de sesiones, métricas de rendimiento y progreso.</li>
              <li><strong>Datos de configuración:</strong> perfiles de simulación creados, preferencias y ajustes personalizados.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y datos de acceso para fines de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">2. Cómo usamos tu información</h2>
            <p className="mb-3">Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Proveer, mantener y mejorar los servicios de simulación y análisis de Closer AI.</li>
              <li>Generar retroalimentación personalizada y métricas de rendimiento tras cada sesión.</li>
              <li>Entrenar y mejorar nuestros modelos de inteligencia artificial para ofrecerte una experiencia más realista.</li>
              <li>Enviarte comunicaciones relacionadas con tu cuenta y actualizaciones del servicio.</li>
              <li>Prevenir fraude y garantizar la seguridad de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">3. Grabaciones de voz</h2>
            <p>
              Las simulaciones de voz se procesan en tiempo real. Las grabaciones se utilizan exclusivamente para generar tu análisis de rendimiento y retroalimentación. No compartimos tus grabaciones de voz con terceros. Puedes solicitar la eliminación de tus grabaciones en cualquier momento contactándonos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">4. Compartición de datos</h2>
            <p className="mb-3">
              No vendemos tu información personal. Podemos compartir datos limitados con:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Proveedores de infraestructura:</strong> servicios de autenticación (como Google/Supabase), alojamiento en la nube y procesamiento de IA, bajo estrictos acuerdos de confidencialidad.</li>
              <li><strong>Requerimientos legales:</strong> cuando sea necesario para cumplir con obligaciones legales o proteger nuestros derechos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">5. Seguridad de los datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo cifrado en tránsito y en reposo, controles de acceso y monitorización continua.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">6. Tus derechos</h2>
            <p className="mb-3">
              Tienes derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Acceder a los datos personales que tenemos sobre ti.</li>
              <li>Solicitar la corrección o eliminación de tu información.</li>
              <li>Exportar tus datos de rendimiento.</li>
              <li>Retirar tu consentimiento y cerrar tu cuenta en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">7. Retención de datos</h2>
            <p>
              Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta, borraremos tus datos personales en un plazo máximo de 30 días, salvo que la ley exija lo contrario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre cambios significativos a través del correo electrónico asociado a tu cuenta o mediante un aviso visible en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--brand-ink-900)] mb-3">9. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, puedes contactarnos en <a href="mailto:privacidad@closer.ai" className="text-[var(--brand-blue-600)] underline hover:text-[var(--brand-blue-700)]">privacidad@closer.ai</a>.
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
