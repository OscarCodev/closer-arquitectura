import type {
  RecentSession,
  SimulationSession,
  ConversationTurn,
  SimulationContext,
  SimulationAnalysis,
} from '../types/setup-types'

const PROSPECT_CONTEXT: SimulationContext = {
  prospectName: 'Ana García',
  prospectRole: 'Directora de Marketing',
  prospectCompany: 'EcoVida',
  prospectDescription:
    'Directora de Marketing con 8 años de experiencia en el sector retail. Busca soluciones que le ayuden a optimizar su funnel de ventas online y reducir los costos de adquisición de clientes.',
  salesContext:
    'Vendo soluciones SaaS de automatización comercial para medianas empresas. Mi objetivo es cerrar una reunión de demo con la prospecto, demostrando cómo podemos ayudarle a reducir tiempos operativos en su equipo de ventas.',
}

const CONVERSATION_TURNS: ConversationTurn[] = [
  {
    turn: 1,
    ia: 'Hola, gracias por conectarte. Soy Ana. Disculpa, tengo otra reunión en 30 minutos, así que, ¿podríamos ir directos al grano con tu propuesta?',
    tu: 'Hola Ana, soy Óscar de Tech Solutions. Tenemos una propuesta de software muy buena probada por muchas empresas de renombre.',
    evaluation: 'critical',
    title: 'Error Crítico: No empatizaste con su dolor',
    diagnostic:
      'Ignoraste su advertencia de que tiene poco tiempo. En lugar de adaptar tu pitch y mostrar urgencia, usaste una introducción genérica de ventas.',
    improvement:
      '"Ana, entiendo que vas contra reloj, así que iré directo al grano. Nuestra solución acelera ventas. ¿En qué parte del proceso están perdiendo más tiempo hoy?"',
  },
  {
    turn: 2,
    ia: 'Perfecto. Mira, nuestro problema principal es que el equipo comercial pierde mucho tiempo registrando datos en hojas de cálculo y los leads se enfrían.',
    tu: 'Ah, entiendo perfecto. Pues nuestro software Tech Solutions hace todo eso automático, tiene reportes espectaculares y una interfaz de colores muy amigable.',
    evaluation: 'warning',
    title: 'Mejorable: Saltando a la solución prematuramente',
    diagnostic:
      'Vomitaste características (reportes, colores) antes de entender el impacto real del problema. Debiste explorar cuánto dinero/tiempo les cuesta este problema.',
    improvement:
      '"Eso suena frustrante. ¿Tienen medido aproximadamente cuántos leads o minutos al día están perdiendo por culpa de ese registro manual?"',
  },
  {
    turn: 3,
    ia: 'No lo tenemos medido exactamente en dólares, pero a ojo los vendedores gastan como 2 horas diarias en tareas operativas.',
    tu: '¡Uf, 2 horas es muchísimo! Con nuestra plataforma eso se reduce a cero. Les configuraré una demo para mostrarles cómo funciona.',
    evaluation: 'good',
    title: 'Excelente: Buena validación del dolor',
    diagnostic:
      'Validaste su problema ("2 horas es muchísimo") mostrando sorpresa genuina y propusiste un siguiente paso lógico (la demo) atado a su métrica de tiempo.',
    improvement: null,
  },
  {
    turn: 4,
    ia: 'Me parece bien lo de la demo. Pero dime, ¿es muy caro su sistema? No tenemos mucho presupuesto asignado.',
    tu: 'Para nada, somos los más baratos del mercado. Cuesta solo 50 USD al mes por usuario.',
    evaluation: 'critical',
    title: 'Error Crítico: Regalar el precio sin justificar valor',
    diagnostic:
      'Defenderse diciendo "somos los más baratos" destruye el valor de tu marca. Además, diste el precio directo sin atarlo al ROI de las 2 horas que ahorarás.',
    improvement:
      '"Ana, nuestro precio depende del volumen, pero más allá de la herramienta, piénsalo como una inversión. Si les recuperamos esas 2 horas diarias por vendedor, el sistema se paga solo al segundo día. ¿Te cuadra esa matemática?"',
  },
  {
    turn: 5,
    ia: 'Tienes razón, visto así tiene bastante sentido. Agendemos la demo y lo revisamos.',
    tu: '¡Perfecto Ana! Te envío el calendario de inmediato, un abrazo.',
    evaluation: 'neutral',
    title: 'Neutro: Cierre estándar',
    diagnostic:
      'Lograste el objetivo (la demo), pero la despedida fue muy rápida. Podrías haber hecho un micro-acuerdo pidiendo que invite a otros tomadores de decisión.',
    improvement: null,
  },
]

const RENEWAL_CONVERSATION_TURNS: ConversationTurn[] = [
  {
    turn: 1,
    ia: 'Hola, María por aquí. Estamos evaluando renovar, pero quiero entender rápido qué valor adicional nos darían este año.',
    tu: 'Perfecto, María. Antes de hablar de renovación, prefiero validar qué resultados lograron y dónde todavía hay espacio para mejorar.',
    evaluation: 'good',
    title: 'Excelente: Apertura consultiva',
    diagnostic: 'Iniciaste con enfoque en resultados y diagnóstico, no con presión comercial.',
    improvement: null,
  },
  {
    turn: 2,
    ia: 'El equipo redujo tiempos, pero aún tenemos fricción en seguimiento de oportunidades.',
    tu: 'Gracias, eso ayuda mucho. Si reforzamos ese seguimiento con automatizaciones y alertas, podríamos mejorar la conversión final sin aumentar carga operativa.',
    evaluation: 'good',
    title: 'Muy bien: Conexión entre dolor y valor',
    diagnostic: 'Relacionaste el problema detectado con una mejora concreta y relevante para negocio.',
    improvement: null,
  },
  {
    turn: 3,
    ia: 'Suena bien. Mi preocupación es que el equipo adopte rápido esos ajustes.',
    tu: 'Totalmente válido. Podemos hacerlo por etapas con un plan de adopción ligero para que el cambio sea natural y medible desde la primera semana.',
    evaluation: 'good',
    title: 'Excelente: Manejo de objeción con claridad',
    diagnostic: 'Validaste la objeción y diste una respuesta concreta reduciendo riesgo percibido.',
    improvement: null,
  },
  {
    turn: 4,
    ia: 'Perfecto, avancemos con la renovación y revisamos ese plan en detalle.',
    tu: 'Genial, María. Te comparto hoy mismo el plan de implementación y definimos responsables para arrancar sin fricción.',
    evaluation: 'neutral',
    title: 'Neutro: Cierre correcto',
    diagnostic: 'Cerraste bien la conversación con próximos pasos claros.',
    improvement: null,
  },
]

const SESSION_ONE_ANALYSIS: SimulationAnalysis = {
  voice: {
    speechRate: {
      value: 185,
      unit: 'ppm',
      insight: 'Acelerado. Trata de mantenerte entre 130-150 palabras por minuto para dar peso a tus palabras.',
    },
    talkListenRatio: {
      talk: 70,
      listen: 30,
      insight: 'Hablaste mucho. En B2B, trata de acercarte a un ratio 40/60.',
    },
    longestMonologue: {
      value: '2:15',
      insight: 'Aburriste al prospecto. Rompe tus monólogos con preguntas abiertas.',
    },
    fillers: {
      count: 3,
      examples: [
        { text: 'eh', count: 2 },
        { text: 'este', count: 1 },
      ],
      insight: 'Excelente control verbal. Casi no usaste palabras de relleno.',
    },
  },
  skills: {
    labels: ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta'],
    values: [35, 42, 38, 28, 55],
    strongest: { label: 'Cierre', value: 55 },
    weakest: { label: 'Objeciones', value: 28 },
    averageSuccessRate: 42,
  },
}

const SESSION_TWO_ANALYSIS: SimulationAnalysis = {
  voice: {
    speechRate: {
      value: 154,
      unit: 'ppm',
      insight: 'Buen ritmo. Sigue manteniendo pausas más intencionales para reforzar tus preguntas.',
    },
    talkListenRatio: {
      talk: 56,
      listen: 44,
      insight: 'Vas mejorando el balance, aunque todavía puedes abrir más espacio para que el prospecto se explaye.',
    },
    longestMonologue: {
      value: '1:32',
      insight: 'Buen control. Los monólogos ya no dominan la conversación.',
    },
    fillers: {
      count: 5,
      examples: [
        { text: 'eh', count: 3 },
        { text: 'o sea', count: 2 },
      ],
      insight: 'Aparecieron algunas muletillas en los momentos de objeción. Respira antes de responder.',
    },
  },
  skills: {
    labels: ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta'],
    values: [62, 58, 51, 45, 72],
    strongest: { label: 'Cierre', value: 72 },
    weakest: { label: 'Objeciones', value: 45 },
    averageSuccessRate: 58,
  },
}

const SESSION_THREE_ANALYSIS: SimulationAnalysis = {
  voice: {
    speechRate: {
      value: 136,
      unit: 'ppm',
      insight: 'Ritmo sólido y claro. Tu cadencia ayuda a que el prospecto siga el hilo sin esfuerzo.',
    },
    talkListenRatio: {
      talk: 47,
      listen: 53,
      insight: 'Buen balance. Escuchaste más de lo que hablaste, lo que favoreció el descubrimiento.',
    },
    longestMonologue: {
      value: '1:04',
      insight: 'Muy bien. Evitaste bloques largos y mantuviste la conversación dinámica.',
    },
    fillers: {
      count: 1,
      examples: [{ text: 'mmm', count: 1 }],
      insight: 'Casi no aparecen muletillas. Muy buena limpieza verbal.',
    },
  },
  skills: {
    labels: ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta'],
    values: [88, 85, 90, 87, 94],
    strongest: { label: 'Cierre', value: 94 },
    weakest: { label: 'Descubrimiento', value: 85 },
    averageSuccessRate: 89,
  },
}

const SESSION_FOUR_ANALYSIS: SimulationAnalysis = {
  voice: {
    speechRate: {
      value: 168,
      unit: 'ppm',
      insight: 'Algo acelerado. En seguimientos, una cadencia más pausada ayuda a sonar más consultivo.',
    },
    talkListenRatio: {
      talk: 61,
      listen: 39,
      insight: 'Tienes buen control del discurso, pero todavía conviene escuchar un poco más al cliente.',
    },
    longestMonologue: {
      value: '1:48',
      insight: 'El monólogo sigue siendo largo en algunos tramos. Corta con preguntas de validación.',
    },
    fillers: {
      count: 4,
      examples: [
        { text: 'eh', count: 2 },
        { text: 'pues', count: 2 },
      ],
      insight: 'Pequeña presencia de muletillas cuando explicas valor. Intenta frenar antes de cerrar ideas.',
    },
  },
  skills: {
    labels: ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta'],
    values: [60, 62, 66, 58, 70],
    strongest: { label: 'Cierre', value: 70 },
    weakest: { label: 'Objeciones', value: 58 },
    averageSuccessRate: 63,
  },
}

const SESSION_FIVE_ANALYSIS: SimulationAnalysis = {
  voice: {
    speechRate: {
      value: 149,
      unit: 'ppm',
      insight: 'Buen ritmo para tratar objeciones. Sonaste más firme y menos reactivo.',
    },
    talkListenRatio: {
      talk: 49,
      listen: 51,
      insight: 'Balance bastante sano, con buena apertura para escuchar la restricción presupuestaria.',
    },
    longestMonologue: {
      value: '1:16',
      insight: 'Controlaste bien las explicaciones y mantuviste la negociación más conversacional.',
    },
    fillers: {
      count: 2,
      examples: [
        { text: 'bueno', count: 1 },
        { text: 'a ver', count: 1 },
      ],
      insight: 'Muy buena limpieza verbal. Las muletillas no distraen la objeción principal.',
    },
  },
  skills: {
    labels: ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta'],
    values: [55, 61, 57, 52, 63],
    strongest: { label: 'Cierre', value: 63 },
    weakest: { label: 'Objeciones', value: 52 },
    averageSuccessRate: 58,
  },
}

export const MOCK_SIMULATION_SESSION_ATTEMPT_1: SimulationSession = {
  id: 'sim-001',
  createdAt: '2026-04-05T14:30:00Z',
  metrics: {
    score: 42,
    duration: '03:22',
    turns: 5,
    errors: 2,
    mejorables: 1,
    brillantes: 1,
    neutros: 1,
  },
  context: PROSPECT_CONTEXT,
  conversation: CONVERSATION_TURNS,
  transcript:
    'Transcripción completa de la llama 1. Ana: Hola, gracias por conectarte... [full transcript here]',
  analysis: SESSION_ONE_ANALYSIS,
}

export const MOCK_SIMULATION_SESSION_ATTEMPT_2: SimulationSession = {
  id: 'sim-002',
  createdAt: '2026-04-05T14:45:00Z',
  metrics: {
    score: 67,
    duration: '04:15',
    turns: 6,
    errors: 1,
    mejorables: 2,
    brillantes: 2,
    neutros: 1,
  },
  context: PROSPECT_CONTEXT,
  conversation: [
    {
      turn: 1,
      ia: 'Hola, gracias por conectarte. Soy Ana. Disculpa, tengo otra reunión en 30 minutos, así que, ¿podríamos ir directos al grano con tu propuesta?',
      tu: 'Claro Ana, lo respeto mucho. Tengo 3 minutos de contexto que creo van a valer la pena. ¿Nos vamos directo?',
      evaluation: 'good',
      title: 'Excellent: Respetaste su tiempo',
      diagnostic: 'Validaste su restricción de tiempo y le diste opciones claras.',
      improvement: null,
    },
    ...CONVERSATION_TURNS.slice(1),
  ],
  transcript:
    'Transcripción completa de la llamada 2. Con mejor empatía inicial... [full transcript here]',
  analysis: SESSION_TWO_ANALYSIS,
}

export const MOCK_SIMULATION_SESSION_ATTEMPT_3: SimulationSession = {
  id: 'sim-005',
  createdAt: '2026-04-05T15:00:00Z',
  metrics: {
    score: 82,
    duration: '04:05',
    turns: 6,
    errors: 0,
    mejorables: 1,
    brillantes: 4,
    neutros: 1,
  },
  context: PROSPECT_CONTEXT,
  conversation: [
    {
      turn: 1,
      ia: 'Hola, soy Ana. Tenemos ya una solución con otro proveedor, pero estoy abierta a escuchar si realmente aportas algo distinto.',
      tu: 'Perfecto, Ana. No vengo a forzarte a cambiar; prefiero entender qué resultado te haría considerar una mejora real.',
      evaluation: 'good',
      title: 'Excelente: Abriste con una postura consultiva',
      diagnostic: 'En vez de empujar una demo, priorizaste entender el criterio de cambio del prospecto.',
      improvement: null,
    },
    {
      turn: 2,
      ia: 'Lo que más me preocupa es que el equipo adopte otra herramienta y nadie la use. Ya nos pasó antes.',
      tu: 'Tiene sentido. ¿Qué hizo que la adopción anterior fallara: falta de entrenamiento, exceso de complejidad o poco seguimiento interno?',
      evaluation: 'good',
      title: 'Muy bien: Exploraste la causa raíz',
      diagnostic: 'Hiciste preguntas abiertas que ayudan a descubrir el origen de la objeción.',
      improvement: null,
    },
    {
      turn: 3,
      ia: 'Creo que fue una mezcla de complejidad y poca gestión del cambio.',
      tu: 'Entonces podríamos enfocarnos en un despliegue por etapas con acompañamiento para evitar ese desgaste.',
      evaluation: 'warning',
      title: 'Mejorable: Saltaste a la propuesta demasiado pronto',
      diagnostic: 'Propusiste solución antes de profundizar en el impacto operativo de la objeción.',
      improvement: '"Para ayudarte mejor, ¿cuánto les costó esa mala adopción en tiempo o productividad?"',
    },
    {
      turn: 4,
      ia: 'Eso sí nos dejó bastante frustrados porque tardamos meses en retomar el proceso.',
      tu: 'Entiendo. Si recuperamos ese tiempo perdido y la adopción sube, el cambio ya tendría mucho más sentido.',
      evaluation: 'good',
      title: 'Buen avance: Reencuadraste el valor',
      diagnostic: 'Conectaste el problema con un beneficio concreto de retorno de tiempo.',
      improvement: null,
    },
  ],
  transcript: 'Transcripción completa de la llamada 3. Con dominio avanzado... [full transcript here]',
  analysis: SESSION_THREE_ANALYSIS,
}

export const MOCK_RECENT_SESSION: RecentSession = {
  id: 'session-001',
  name: 'Discovery SaaS',
  prospect: 'Ana García',
  context: 'Directora de Marketing en EcoVida - optimizar funnel de ventas online',
  createdAt: '2026-04-05T14:30:00Z',
  simulations: [MOCK_SIMULATION_SESSION_ATTEMPT_1, MOCK_SIMULATION_SESSION_ATTEMPT_2, MOCK_SIMULATION_SESSION_ATTEMPT_3],
}

// Mock data for recent sessions list in sidebar
export const MOCK_RECENT_SESSIONS: RecentSession[] = [
  MOCK_RECENT_SESSION,
  {
    id: 'session-006',
    name: 'Rescate de renovación Q2',
    prospect: 'Andrés Paredes',
    context: 'COO en DataBridge - renovación en riesgo por adopción parcial y presión de presupuesto',
    createdAt: '2026-04-06T09:20:00Z',
    simulations: [
      {
        id: 'sim-101',
        createdAt: '2026-04-06T09:20:00Z',
        metrics: {
          score: 46,
          duration: '04:55',
          turns: 5,
          errors: 2,
          mejorables: 1,
          brillantes: 1,
          neutros: 1,
        },
        context: {
          prospectName: 'Andrés Paredes',
          prospectRole: 'COO',
          prospectCompany: 'DataBridge',
          prospectDescription: 'Perfil ejecutivo orientado a eficiencia operativa, escéptico frente a costos recurrentes.',
          salesContext: 'Renovación anual en riesgo: baja adopción del equipo y cuestionamiento de ROI en comité.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'Andrés por aquí. Antes de renovar, necesito saber por qué deberíamos seguir pagando este contrato.',
            tu: 'La verdad tenemos una plataforma robusta y somos líderes en el mercado, así que renovar sería lo lógico.',
            evaluation: 'critical',
            title: 'Error Crítico: Respuesta centrada en ti, no en su contexto',
            diagnostic: 'Abriste defendiendo marca en vez de conectar con su problema de negocio.',
            improvement: '"Totalmente válido, Andrés. Para tomar una buena decisión, ¿qué resultado concreto necesitan ver este trimestre para justificar la renovación?"',
          },
          {
            turn: 2,
            ia: 'El equipo usa la herramienta de forma parcial y eso me preocupa.',
            tu: 'Entiendo, pero en general los clientes tardan en adoptar. Es normal.',
            evaluation: 'warning',
            title: 'Mejorable: Validación débil del riesgo',
            diagnostic: 'Reconociste el problema, pero lo minimizaste con una respuesta genérica.',
            improvement: '"¿Qué áreas están teniendo menor adopción y cómo impacta eso en sus tiempos operativos hoy?"',
          },
          {
            turn: 3,
            ia: 'Si no logramos adopción completa, no tiene sentido renovar igual que el año pasado.',
            tu: 'Entonces les podemos dar un descuento para cerrar rápido.',
            evaluation: 'critical',
            title: 'Error Crítico: Fuiste a precio sin reconstruir valor',
            diagnostic: 'Usaste descuento como salida temprana y debilitaste la percepción de impacto.',
            improvement: '"Antes de hablar de precio, alineemos un plan de adopción con métricas para que la inversión se sostenga sola."',
          },
          {
            turn: 4,
            ia: 'Si vemos una ruta clara de adopción, puedo defender la renovación.',
            tu: 'Perfecto, armemos ese plan por etapas y lo revisamos con tu equipo.',
            evaluation: 'good',
            title: 'Buen giro: Propusiste siguiente paso',
            diagnostic: 'Recuperaste la conversación con una propuesta accionable.',
            improvement: null,
          },
          {
            turn: 5,
            ia: 'Bien, enviámelo y lo vemos esta semana.',
            tu: 'Te lo envío hoy. Gracias por el tiempo.',
            evaluation: 'neutral',
            title: 'Neutro: Cierre correcto',
            diagnostic: 'Cierre funcional, con margen para concretar compromiso más fuerte.',
            improvement: null,
          },
        ],
        transcript: 'Transcripción intento 1 de rescate de renovación Q2...',
        analysis: SESSION_ONE_ANALYSIS,
      },
      {
        id: 'sim-102',
        createdAt: '2026-04-06T10:05:00Z',
        metrics: {
          score: 63,
          duration: '04:31',
          turns: 5,
          errors: 1,
          mejorables: 1,
          brillantes: 2,
          neutros: 1,
        },
        context: {
          prospectName: 'Andrés Paredes',
          prospectRole: 'COO',
          prospectCompany: 'DataBridge',
          prospectDescription: 'Perfil ejecutivo orientado a eficiencia operativa, escéptico frente a costos recurrentes.',
          salesContext: 'Renovación anual en riesgo: baja adopción del equipo y cuestionamiento de ROI en comité.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'Antes de renovar, necesito una razón clara para continuar con ustedes.',
            tu: 'De acuerdo. ¿Qué indicador operativo necesita mejorar para que la renovación tenga sentido para ti?',
            evaluation: 'good',
            title: 'Excelente: Iniciaste con criterio de valor',
            diagnostic: 'La pregunta orientó la conversación a negocio desde el primer minuto.',
            improvement: null,
          },
          {
            turn: 2,
            ia: 'Si no mejoramos adopción, internamente me van a cuestionar el gasto.',
            tu: 'Eso nos pasa seguido, pero con capacitación suele arreglarse.',
            evaluation: 'warning',
            title: 'Mejorable: Respuesta todavía genérica',
            diagnostic: 'La idea es correcta, pero faltó aterrizar en su operación específica.',
            improvement: '"¿En qué equipos está cayendo la adopción para priorizar un plan concreto de 30 días?"',
          },
          {
            turn: 3,
            ia: 'Principalmente en operaciones y soporte.',
            tu: 'Perfecto, entonces propondría un plan de activación por áreas con metas de uso semanales.',
            evaluation: 'good',
            title: 'Muy bien: Propuesta específica',
            diagnostic: 'Conectaste el diagnóstico con un plan accionable.',
            improvement: null,
          },
          {
            turn: 4,
            ia: '¿Y el precio? porque hoy seguimos tensos de presupuesto.',
            tu: 'Podemos bajar bastante para asegurar la firma este mes.',
            evaluation: 'critical',
            title: 'Error Crítico: Cediste precio sin defender ROI',
            diagnostic: 'Faltó sostener valor antes de abrir conversación comercial.',
            improvement: '"Primero validemos el retorno esperado del plan de adopción y luego definimos estructura económica."',
          },
          {
            turn: 5,
            ia: 'Mándame propuesta actualizada y la revisamos.',
            tu: 'Listo, te la comparto hoy.',
            evaluation: 'neutral',
            title: 'Neutro: Cierre básico',
            diagnostic: 'Cierre correcto pero sin compromiso explícito de próxima reunión.',
            improvement: null,
          },
        ],
        transcript: 'Transcripción intento 2 de rescate de renovación Q2...',
        analysis: SESSION_TWO_ANALYSIS,
      },
      {
        id: 'sim-103',
        createdAt: '2026-04-06T10:40:00Z',
        metrics: {
          score: 79,
          duration: '04:12',
          turns: 4,
          errors: 0,
          mejorables: 1,
          brillantes: 2,
          neutros: 1,
        },
        context: {
          prospectName: 'Andrés Paredes',
          prospectRole: 'COO',
          prospectCompany: 'DataBridge',
          prospectDescription: 'Perfil ejecutivo orientado a eficiencia operativa, escéptico frente a costos recurrentes.',
          salesContext: 'Renovación anual en riesgo: baja adopción del equipo y cuestionamiento de ROI en comité.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'Necesito ver impacto real para sostener la renovación ante comité.',
            tu: 'Claro. ¿Qué dos indicadores deberíamos mover en 30 días para que esa defensa sea sólida?',
            evaluation: 'good',
            title: 'Excelente: Marco de éxito claro',
            diagnostic: 'Diste estructura concreta para la decisión.',
            improvement: null,
          },
          {
            turn: 2,
            ia: 'Adopción en operaciones y reducción de tiempos de seguimiento.',
            tu: 'Perfecto, trabajemos con responsables por área y checkpoints semanales para medir avance.',
            evaluation: 'good',
            title: 'Muy bien: Plan operativo aterrizado',
            diagnostic: 'Conectaste resultado esperado con método de ejecución.',
            improvement: null,
          },
          {
            turn: 3,
            ia: 'Suena bien. ¿Cómo queda el contrato?',
            tu: 'Te mando una versión final y lo vemos cuando puedas.',
            evaluation: 'warning',
            title: 'Mejorable: Faltó cerrar siguiente paso concreto',
            diagnostic: 'La salida fue vaga; faltó agendar hito con fecha y participantes.',
            improvement: '"Te la envío hoy y agendamos 25 minutos mañana con finanzas para validarla juntos."',
          },
          {
            turn: 4,
            ia: 'Perfecto, quedo atento.',
            tu: 'Gracias, avanzamos con eso.',
            evaluation: 'neutral',
            title: 'Neutro: Cierre correcto',
            diagnostic: 'Cierre funcional, con oportunidad de mayor compromiso.',
            improvement: null,
          },
        ],
        transcript: 'Transcripción intento 3 de rescate de renovación Q2...',
        analysis: SESSION_FOUR_ANALYSIS,
      },
      {
        id: 'sim-104',
        createdAt: '2026-04-06T11:15:00Z',
        metrics: {
          score: 92,
          duration: '03:58',
          turns: 4,
          errors: 0,
          mejorables: 0,
          brillantes: 3,
          neutros: 1,
        },
        context: {
          prospectName: 'Andrés Paredes',
          prospectRole: 'COO',
          prospectCompany: 'DataBridge',
          prospectDescription: 'Perfil ejecutivo orientado a eficiencia operativa, escéptico frente a costos recurrentes.',
          salesContext: 'Renovación anual en riesgo: baja adopción del equipo y cuestionamiento de ROI en comité.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'Si renovamos, necesito evidencia de que el plan de adopción sí va a funcionar.',
            tu: 'Totalmente. Definamos dos metas de negocio para 30 días y responsables por área para que lo puedas defender con datos.',
            evaluation: 'good',
            title: 'Excelente: Liderazgo consultivo',
            diagnostic: 'Abriste con claridad de impacto y gobernanza.',
            improvement: null,
          },
          {
            turn: 2,
            ia: 'Bien, me interesa que operaciones use el flujo completo y bajar tiempos de seguimiento.',
            tu: 'Perfecto. Te propongo tablero semanal con adopción por equipo y meta de reducción de tiempo validada con tu líder de operaciones.',
            evaluation: 'good',
            title: 'Muy bien: Tradujiste intención en mecanismo',
            diagnostic: 'Concretaste indicadores, frecuencia y ownership.',
            improvement: null,
          },
          {
            turn: 3,
            ia: '¿Y a nivel contractual?',
            tu: 'Mantenemos estructura actual con revisión de hitos al día 30. Si cumplimos metas, escalamos; si no, ajustamos plan sin fricción.',
            evaluation: 'good',
            title: 'Excelente: Manejo comercial con control de riesgo',
            diagnostic: 'Defendiste valor y redujiste percepción de riesgo sin erosionar precio.',
            improvement: null,
          },
          {
            turn: 4,
            ia: 'Me sirve, avancemos. Agenda la revisión con finanzas.',
            tu: 'Listo. Te envío invitación hoy con finanzas y operaciones para cerrar la renovación.',
            evaluation: 'neutral',
            title: 'Neutro: Cierre sólido',
            diagnostic: 'Cierre claro con próximos pasos definidos.',
            improvement: null,
          },
        ],
        transcript: 'Transcripción intento 4 de rescate de renovación Q2...',
        analysis: SESSION_THREE_ANALYSIS,
      },
    ],
  },
  {
    id: 'session-002',
    name: 'Demo Pyme',
    prospect: 'Carlos López',
    context: 'Gerente General en StartupTech - automatización de procesos',
    createdAt: '2026-04-04T10:15:00Z',
    simulations: [
      {
        id: 'sim-003',
        createdAt: '2026-04-04T10:15:00Z',
        metrics: {
          score: 77,
          duration: '05:10',
          turns: 7,
          errors: 1,
          mejorables: 1,
          brillantes: 3,
          neutros: 2,
        },
        context: {
          prospectName: 'Carlos López',
          prospectRole: 'Gerente General',
          prospectCompany: 'StartupTech',
          prospectDescription: 'Gerente General buscando optimizar procesos internos.',
          salesContext: 'Soluciones de automatización para medianas empresas.',
        },
        conversation: CONVERSATION_TURNS,
        transcript: 'Transcripción de la llamada con Carlos López...',
        analysis: SESSION_TWO_ANALYSIS,
      },
    ],
  },
  {
    id: 'session-003',
    name: 'Renovación anual',
    prospect: 'María González',
    context: 'Directora de Proyectos en EnterpriseX - renovación de contrato anual',
    createdAt: '2026-04-03T16:45:00Z',
    simulations: [
      {
        id: 'sim-004',
        createdAt: '2026-04-03T16:45:00Z',
        metrics: {
          score: 91,
          duration: '02:50',
          turns: 4,
          errors: 0,
          mejorables: 0,
          brillantes: 3,
          neutros: 1,
        },
        context: {
          prospectName: 'María González',
          prospectRole: 'Directora de Proyectos',
          prospectCompany: 'EnterpriseX',
          prospectDescription: 'Directora de Proyectos satisfecha buscando renovar en mejores condiciones.',
          salesContext: 'Renovación de contrato con foco en valor percibido y expansión de licencias.',
        },
        conversation: RENEWAL_CONVERSATION_TURNS,
        transcript: 'Transcripción de la llamada de renovación con María...',
        analysis: SESSION_THREE_ANALYSIS,
      },
    ],
  },
  {
    id: 'session-004',
    name: 'Seguimiento outbound',
    prospect: 'Javier Ortega',
    context: 'VP Comercial en NovaLog - seguimiento de propuesta enviada',
    createdAt: '2026-04-02T11:20:00Z',
    simulations: [
      {
        id: 'sim-005',
        createdAt: '2026-04-02T11:20:00Z',
        metrics: {
          score: 64,
          duration: '04:48',
          turns: 6,
          errors: 1,
          mejorables: 2,
          brillantes: 2,
          neutros: 1,
        },
        context: {
          prospectName: 'Javier Ortega',
          prospectRole: 'VP Comercial',
          prospectCompany: 'NovaLog',
          prospectDescription: 'Lider de ventas con foco en pipeline y velocidad de cierre.',
          salesContext: 'Seguimiento outbound para destrabar propuesta en etapa de decision.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'Hola, retomo la propuesta que nos enviaste. Antes de hablar de precio quiero saber si ya la revisaste con el equipo.',
            tu: 'Sí, claro. Si te parece, primero confirmo qué parte de la propuesta les resultó más útil y así priorizamos la conversación.',
            evaluation: 'good',
            title: 'Excelente: Retomaste con foco',
            diagnostic: 'Empezaste validando contexto y no con una venta agresiva.',
            improvement: null,
          },
          {
            turn: 2,
            ia: 'Lo vimos, pero el valor sigue pareciendo alto para el momento que estamos viviendo.',
            tu: 'Entiendo la preocupación. ¿Qué parte del presupuesto está más presionada hoy y qué tendría que pasar para que el proyecto siga siendo viable?',
            evaluation: 'warning',
            title: 'Bien, pero todavía falta cuantificar',
            diagnostic: 'Abordaste la objeción con una pregunta útil, aunque aún no aterrizaste el impacto económico.',
            improvement: '"Si reducimos X horas o evitamos Y costo, ¿eso abriría espacio dentro de su presupuesto?"',
          },
          {
            turn: 3,
            ia: 'Si me enseñas un caso con ROI claro, podría defenderlo mejor internamente.',
            tu: 'Perfecto. Te comparto un caso comparable con ahorros medibles y te propongo una revisión corta con tu equipo.',
            evaluation: 'good',
            title: 'Muy bien: Convertiste la objeción en siguiente paso',
            diagnostic: 'Usaste la objeción para avanzar la negociación y no para defenderte.',
            improvement: null,
          },
        ],
        transcript: 'Transcripción del seguimiento outbound con Javier...',
        analysis: SESSION_FOUR_ANALYSIS,
      },
    ],
  },
  {
    id: 'session-005',
    name: 'Objeción presupuesto',
    prospect: 'Paula Ibáñez',
    context: 'Gerente de Compras en Grupo Andina - negociación por presupuesto',
    createdAt: '2026-04-01T09:05:00Z',
    simulations: [
      {
        id: 'sim-006',
        createdAt: '2026-04-01T09:05:00Z',
        metrics: {
          score: 58,
          duration: '05:36',
          turns: 7,
          errors: 2,
          mejorables: 1,
          brillantes: 1,
          neutros: 3,
        },
        context: {
          prospectName: 'Paula Ibáñez',
          prospectRole: 'Gerente de Compras',
          prospectCompany: 'Grupo Andina',
          prospectDescription: 'Perfil analitico orientado a ahorro y riesgo contractual.',
          salesContext: 'Llamada para defender precio ante objecion de presupuesto anual limitado.',
        },
        conversation: [
          {
            turn: 1,
            ia: 'El precio sigue siendo mi principal preocupación. Necesitamos entender si hay margen para bajar el costo.',
            tu: 'Lo entiendo. Antes de mover precio, quiero ver si el valor esperado compensa la inversión que están evaluando.',
            evaluation: 'good',
            title: 'Buena apertura: Enfocaste valor antes de descuento',
            diagnostic: 'Evitar bajar precio de inmediato te ayuda a sostener la percepción de valor.',
            improvement: null,
          },
          {
            turn: 2,
            ia: 'Nos preocupa que la herramienta no sea usada lo suficiente como para justificarla.',
            tu: '¿Qué porcentaje de adopción necesitarían para considerar que el proyecto está funcionando bien?',
            evaluation: 'good',
            title: 'Excelente: Convertiste una queja en criterio',
            diagnostic: 'Hiciste una pregunta concreta que ayuda a fijar una métrica de éxito compartida.',
            improvement: null,
          },
          {
            turn: 3,
            ia: 'Si logramos un piloto pequeño, podríamos presentar esto internamente.',
            tu: 'Me parece bien. Te propongo un piloto acotado con métricas claras para que puedas defenderlo sin riesgo.',
            evaluation: 'warning',
            title: 'Mejorable: Faltó amarrar el costo de la prueba',
            diagnostic: 'La idea del piloto es buena, pero aún no cuantificaste la relación entre prueba y ahorro esperado.',
            improvement: '"Si el piloto demuestra X ahorro en Y semanas, ¿eso sería suficiente para aprobar la compra?"',
          },
        ],
        transcript: 'Transcripción de objeción de presupuesto con Paula...',
        analysis: SESSION_FIVE_ANALYSIS,
      },
    ],
  },
]
