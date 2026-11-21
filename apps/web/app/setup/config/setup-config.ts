import type { AdvancedOptionCopy, AdvancedTab, RecentSession, SavedProfile } from '../types/setup-types'
import { MOCK_RECENT_SESSIONS } from './mock-simulation-data'

export const PROFILE_STORAGE_KEY = 'closer.prospects.v2.4'

export const INITIAL_RECENT_SESSIONS: RecentSession[] = MOCK_RECENT_SESSIONS

export const SAMPLE_SCENARIOS = [
  {
    context:
      'Vendemos una plataforma de automatización comercial para equipos B2B. Ticket promedio mensual de USD 250. El objetivo de la llamada es calificar y cerrar un piloto.',
    prospect:
      'Ana Torres, Head of Sales en una fintech de 40 personas. Usa CRM basico, pipeline desordenado y baja tasa de seguimiento.',
  },
  {
    context:
      'Ofrecemos consultoria de crecimiento para e-commerce en Latam. Servicio trimestral orientado a aumentar conversion y ticket promedio.',
    prospect:
      'Luis Rivas, fundador de marca DTC, equipo pequeño, CAC en aumento y necesidad de estabilizar ROAS.',
  },
]

export const DEFAULT_SAVED_PROFILES: SavedProfile[] = [
  {
    id: '5',
    name: 'Marcela Ríos',
    personName: 'Marcela Ríos',
    roleCompany: 'Head of Operations en LogísticaPro',
    prospect:
      'Directora de operaciones con 12 años de experiencia en cadenas de suministro para el sector retail. Actualmente gestiona una red de 35 centros de distribución en 8 países de Latinoamérica. Su principal dolor es la falta de visibilidad en tiempo real del inventario, lo que genera excesos de stock en unas ubicaciones y quiebres en otras. Ha intentado implementar dos ERPs distintos en los últimos 3 años sin éxito, generando frustración en su equipo y desconfianza hacia nuevos proveedores de tecnología. Necesita demostrar ROI en menos de 6 meses para mantener el apoyo del board. Además, enfrenta presión por reducir costos logísticos en un 15% antes de fin de año, al tiempo que mantiene los niveles de servicio actuales. Es muy analítica, pide datos concretos y casos de éxito verificables antes de tomar decisiones. Suele involucrar a su equipo de TI y al CFO en las evaluaciones.',
    context: '',
    createdAt: 'Hace 5 días',
  },
  {
    id: '1',
    name: 'Carlos Mendoza',
    personName: 'Carlos Mendoza',
    roleCompany: 'Director de IT en TechFlow Solutions',
    prospect:
      'Perfil analítico y directo, enfocado fuertemente en reducir costos de nube y agilizar la lenta integración con sistemas legados.',
    context: '',
    createdAt: 'Hace 2 días',
  },
  {
    id: '2',
    name: 'Laura Valdés',
    personName: 'Laura Valdés',
    roleCompany: 'CEO en Innovate Startups',
    prospect:
      'Visionaria y acelerada. Busca soluciones inmediatas a su falta de tiempo, contratación ineficiente y crecimiento estancado.',
    context: '',
    createdAt: 'Hace 1 semana',
  },
  {
    id: '3',
    name: 'Roberto Gómez',
    personName: 'Roberto Gómez',
    roleCompany: 'Gerente de Compras en Industrias Apex',
    prospect:
      'Comprador escéptico y buen negociador. Siempre exigirá control extremo de presupuesto, teniendo alta aversión al riesgo y largos procesos burocráticos.',
    context: '',
    createdAt: 'Ayer',
  },
  {
    id: '4',
    name: 'Ana Silva',
    personName: 'Ana Silva',
    roleCompany: 'VP of Engineering en GlobalBankCorp',
    prospect:
      'Líder técnica muy orientada a los detalles. Sus principales retos son mitigar la deuda técnica masiva, la seguridad de datos y retener a su talento.',
    context: '',
    createdAt: 'Hace 3 semanas',
  },
]

export const ADVANCED_OPTIONS: Record<AdvancedTab, string[]> = {
  modo: [
    'Ciclo Completo',
    'Prospección',
    'Descubrimiento',
    'Demo',
    'Objeciones',
    'Cierre Venta',
    'Seguimiento',
  ],
  tono: [
    'Perfil Real',
    'Ejecutivo',
    'Analítico',
    'Relacional',
    'Consultivo',
    'Económico',
    'Indeciso',
    'Hostil',
  ],
}

export const ADVANCED_OPTION_COPY: Record<AdvancedTab, Record<string, AdvancedOptionCopy>> = {
  modo: {
    'Ciclo Completo': {
      description: 'Simula la conversación completa de inicio a cierre en una sola sesión.',
      impact: 'Ideal para practicar fluidez general y detectar cuellos de botella.',
    },
    'Prospección': {
      description: 'Entrena apertura, primer contacto y generación de interés con poco contexto.',
      impact: 'Mejora tasa de respuesta y calidad de primeras reuniones.',
    },
    Descubrimiento: {
      description: 'Se enfoca en preguntas, diagnóstico y priorización de necesidades reales.',
      impact: 'Aumenta claridad del problema antes de presentar tu solución.',
    },
    Demo: {
      description: 'Practica demostraciones orientadas a valor según el perfil del prospecto.',
      impact: 'Mejora comprensión del producto y avance a siguiente etapa.',
    },
    Objeciones: {
      description: 'Entrena respuestas ante dudas de precio, timing, riesgo y competencia.',
      impact: 'Reduce bloqueos en la etapa final de negociación.',
    },
    'Cierre Venta': {
      description: 'Practica propuesta final, confirmación de decisión y siguientes pasos.',
      impact: 'Incrementa conversión y reduce oportunidades perdidas al final.',
    },
    Seguimiento: {
      description: 'Entrena mensajes y llamadas post reunión para mantener momentum.',
      impact: 'Mejora recuperación de deals y velocidad del pipeline.',
    },
  },
  tono: {
    'Perfil Real': {
      description:
        'Simulación fidedigna alineada con la descripción y retos detallados en tu campo de perfil.',
      impact: 'Ideal para entrenar situaciones reales basadas estrictamente en tu definición.',
    },
    Ejecutivo: {
      description: 'Persona de alto nivel comercial: directo, valora su tiempo y pide resultados claros.',
      impact: 'Mejora tu capacidad de síntesis y manejo de objeciones de alto impacto.',
    },
    Analítico: {
      description:
        'Perfil escéptico: exige datos, comparativas, pruebas técnicas y detalles de implementación.',
      impact: 'Entrena tu precisión con la información y tu capacidad de demostración de valor.',
    },
    Relacional: {
      description:
        'Prioriza la confianza: amigable, conversador y busca una conexión personal antes del cierre.',
      impact: 'Mejora tu escucha activa y tu capacidad de generar engagement genuino.',
    },
    Consultivo: {
      description: 'Busca un experto: hace muchas preguntas, requiere guía técnica y es muy precavido.',
      impact: 'Perfecciona tu rol como asesor de confianza más que como vendedor.',
    },
    Económico: {
      description:
        'Foco en el precio: prioriza el presupuesto, exige descuentos y busca el máximo ahorro.',
      impact: 'Entrena tu capacidad de defender el precio y justificar el retorno de inversión.',
    },
    Indeciso: {
      description:
        'Miedo al riesgo: evita tomar decisiones, posterga el cierre y teme cometer un error.',
      impact: 'Mejora tu manejo de la urgencia y tu capacidad de transmitir seguridad.',
    },
    Hostil: {
      description:
        'Perfil difícil: cuestiona tu valor, compara agresivamente y pone barreras constantes.',
      impact: 'Ideal para entrenar resiliencia y técnicas avanzadas de giro de objeciones.',
    },
  },
}

export function getInitials(name: string) {
  const parts = name.trim().split(' ')

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  return (name[0] || '').toUpperCase()
}
