from pathlib import Path
import html
ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / 'img'
SRC = IMG / 'fuentes-svg'

# Diagramas vectoriales deterministas: etiquetas legibles y fuentes independientes.
COLORS={'web':'#DBEAFE','app':'#CCFBF1','data':'#FEF3C7','infra':'#EDE9FE','ext':'#FFE4E6','actor':'#F1F5F9'}
def svg_diagram(name,title,rows,edges,subtitle='Propuesta de diseño · Closer',note='Flecha continua: relación indicada · Flecha discontinua: implementa contrato'):
    width=1560; boxw=410; boxh=130; step=230; height=190+len(rows)*step
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">', '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#475569"/></marker></defs>',f'<rect width="{width}" height="{height}" fill="#FFFFFF"/>']
    def text(x,y,t,size=22,weight='normal',anchor='middle'):
        out.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" fill="#0F172A">{html.escape(t)}</text>')
    text(55,55,title,32,'bold','start');text(55,92,subtitle,21,'normal','start')
    positions={}
    for ri,row in enumerate(rows):
        for ci,(key,label,lines,color) in enumerate(row):
            x=(width-len(row)*boxw-(len(row)-1)*70)/2+ci*(boxw+70);y=145+ri*step
            positions[key]=(x,y,boxw,boxh)
    # Draw relationships before cards; route consecutive rows through the empty corridor.
    for a,b,label,*options in edges:
        ax,ay,aw,ah=positions[a];bx,by,bw,bh=positions[b]; dash='stroke-dasharray="9 6"' if options and options[0]=='impl' else ''
        if ay==by:
            forward=bx>ax; x1=ax+aw if forward else ax; x2=bx if forward else bx+bw; y=ay+ah/2
            d=f'M{x1} {y} L{x2} {y}';tx=(x1+x2)/2;ty=y-14
        else:
            down=by>ay;x1=ax+aw/2;y1=ay+ah if down else ay;x2=bx+bw/2;y2=by if down else by+bh
            mid=(y1+y2)/2;d=f'M{x1} {y1} L{x1} {mid} L{x2} {mid} L{x2} {y2}';tx=(x1+x2)/2;ty=mid-12
        out.append(f'<path d="{d}" fill="none" stroke="#475569" stroke-width="2.5" {dash} marker-end="url(#arrow)"/>')
        # White underlay keeps labels readable over orthogonal relationships.
        if label:
            tw=len(label)*11+20;out.append(f'<rect x="{tx-tw/2}" y="{ty-23}" width="{tw}" height="30" fill="white"/>');text(tx,ty,label,19)
    for row in rows:
        for key,label,lines,color in row:
            x,y,w,h=positions[key];out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{COLORS[color]}" stroke="#64748B" stroke-width="2"/>')
            text(x+w/2,y+35,label,23,'bold')
            for i,line in enumerate(lines): text(x+w/2,y+68+i*25,line,20)
    text(55,height-30,note,18,'normal','start');out.append('</svg>')
    (SRC/f'{name}.svg').write_text('\n'.join(out),encoding='utf-8')

def n(key,label,*lines,color='app'): return (key,label,list(lines),color)

svg_diagram('nivel1-contexto','C4 · Nivel 1 · Contexto de Closer',[
 [n('u','Usuario comercial','Vendedor · AE · SDR · Emprendedor',color='actor'),n('a','Administrador','Cuentas · planes · operación',color='actor')],
 [n('c','Closer','Entrenamiento de ventas por voz','Práctica · evaluación · progreso')],
 [n('ia','Servicio de IA','Prospecto virtual y coaching',color='ext'),n('id','Identidad externa','Autenticación de cuentas',color='ext'),n('pn','Pagos y notificaciones','Suscripciones · avisos · soporte',color='ext')]],
 [('u','c','Practica y consulta'),('a','c','Administra'),('c','ia','Simula y evalúa'),('c','id','Autentica'),('c','pn','Solicita servicios')],note='Flechas: relaciones entre personas y sistemas; no muestran dependencias de código.')

svg_diagram('nivel2-contenedores','C4 · Nivel 2 · Contenedores de Closer',[
 [n('w','Aplicación web','Next.js · React · TypeScript','Micrófono · audio · resultados',color='web')],
 [n('b','Backend Closer','Monolito modular','Framework por definir'),n('v','Gemini · voz','Audio y eventos en tiempo real','Servicio externo',color='ext')],
 [n('db','PostgreSQL / Supabase','Datos propios de Closer',color='data'),n('au','Supabase Auth','Identidad · Google OAuth',color='ext'),n('x','Análisis y otras APIs','Gemini · pagos · notificaciones',color='ext')]],
 [('w','b','HTTPS / REST'),('w','v','WSS · acceso autorizado'),('b','db','Persistencia'),('b','au','Verifica identidad'),('b','x','Adaptadores / APIs')],note='Relaciones principales. Web también autentica con Auth; backend prepara acceso a voz. Ver tabla del documento.')

module_rows=[[n('api','API REST','Identidad · validación · rutas',color='web')],[n('up','Usuarios y perfiles','Perfil comercial'),n('ep','Escenarios y prospectos','Contexto · buyer persona'),n('pl','Planes y límites','Suscripción · reserva de cuota')],[n('sp','Sesiones de práctica','Inicio · conversación · cierre'),n('ev','Evaluación y coaching','Métricas · recomendaciones'),n('hi','Historial y progreso','Consultas y evolución')],[n('ad','Adaptadores','Persistencia · identidad · IA','Pagos · notificaciones',color='infra')]]
module_edges=[('api','up','Invoca'),('api','ep','Invoca'),('api','pl','Invoca'),('sp','ad','Usa puertos'),('ev','ad','Usa puertos'),('hi','ad','Composición')]
svg_diagram('nivel3-componentes','C4 · Nivel 3 · Backend modular',module_rows,module_edges,note='API invoca los seis módulos. Relaciones entre módulos mediante APIs públicas: consultar tabla del documento.')
svg_diagram('componentes','Componentes arquitectónicos de Closer',module_rows,module_edges,note='Todos los módulos comparten un despliegue. Adaptadores se inyectan en cada módulo según sus puertos.')
svg_diagram('ArquitecturaMonoliticaCloserEnCapas','Closer · Monolito modular en capas',module_rows,module_edges,note='Separaciones lógicas dentro de un backend. Comunicación por contratos; no son microservicios.')

clean_rows=[[n('p','Presentación','Controladores REST · DTOs',color='web'),n('i','Infraestructura','Supabase · Google GenAI',color='infra')],[n('a','Aplicación','Casos de uso','Orquestación y autorización'),n('pu','Puertos de aplicación','Repositorios · voz · evaluador')],[n('d','Dominio','SesionPractica · Evaluacion','Estados y reglas',color='data')]]
clean_edges=[('p','a','Invoca'),('i','pu','Implementa','impl'),('a','pu','Usa'),('a','d','Opera entidades')]
svg_diagram('ArquitecturaLimpiaCloserWeb','Closer · Clean Architecture',clean_rows,clean_edges,note='Dependencias de código: infraestructura implementa puertos; dominio no depende de las capas externas.')
svg_diagram('paquetes-modulo-sesiones','Paquetes · Módulo de Sesiones',clean_rows,clean_edges,note='Presentación e infraestructura dependen de aplicación; aplicación depende de dominio. Composición conecta adaptadores.')
svg_diagram('arquitectura-inicial','Closer · Arquitectura inicial',[
 [n('w','Aplicación web','Configurar · practicar · revisar',color='web')],[n('b','Backend modular','Reglas · cuotas · casos de uso'),n('v','Gemini · voz','Prospecto en tiempo real',color='ext')],[n('s','Supabase','PostgreSQL · Auth','Storage opcional',color='data'),n('g','Gemini · análisis','Escenarios · evaluación',color='ext'),n('o','Otras integraciones','Pagos · notificaciones',color='ext')]],
 [('w','b','HTTPS / REST'),('w','v','WSS'),('b','s','Persistencia / identidad'),('b','g','Análisis posterior'),('b','o','APIs externas')],note='Web también autentica con Auth. Backend prepara acceso autorizado a voz. Las credenciales permanentes quedan en servidor.')

class_rows=[[n('ctl','ControladorSesiones','finalizar(usuario, sesionId)',color='web')],[n('fin','FinalizarSesion','ejecutar(usuario, sesionId)'),n('eval','EvaluarSesion','ejecutar(usuario, sesionId)')],[n('ses','SesionPractica','estado · propietario · transcripción','finalizar() / cancelar()',color='data'),n('res','Evaluacion','competencias · métricas','validarResultado()',color='data')],[n('rs','«puerto» RepositorioSesiones','buscarPropia() / cerrarAtomico()'),n('re','«puerto» RepositorioEvaluaciones','reservarUnica() / completar()'),n('eg','«puerto» EvaluadorConversacion','evaluar(transcripcion, rubrica)')],[n('ss','RepositorioSesionesSupabase','Implementación de persistencia',color='infra'),n('se','RepositorioEvaluacionesSupabase','Unicidad y transacciones',color='infra'),n('gm','EvaluadorGemini','Normalización de análisis',color='infra')]]
class_edges=[('ctl','fin','Invoca'),('fin','ses','Valida estado'),('eval','res','Valida resultado'),('ss','rs','Implementa','impl'),('se','re','Implementa','impl'),('gm','eg','Implementa','impl')]
for name in ['nivel4-clases','clases-modulo-sesiones']:svg_diagram(name,'Código · Sesiones y Evaluación',class_rows,class_edges,note='Vista resumida. Casos de uso emplean los puertos de su módulo; Evaluación consulta Sesiones por API pública.')

svg_diagram('patron-adapter','Patrón Adapter · Evaluación con IA',[[n('u','EvaluarSesion','Coordina análisis y persistencia')],[n('p','«puerto» EvaluadorConversacion','evaluar(transcripcion, rubrica)')],[n('a','EvaluadorGemini','Traduce formato y errores',color='infra')],[n('g','Gemini · análisis','Servicio externo',color='ext')]], [('u','p','Depende de'),('a','p','Implementa','impl'),('a','g','Invoca API')])
svg_diagram('principio-dip','SOLID · Inversión de dependencias',[[n('u','EvaluarSesion','No importa clientes de proveedores')],[n('p','EvaluadorConversacion','Contrato de aplicación')],[n('g','EvaluadorGemini','Adaptador real',color='infra'),n('f','EvaluadorSimulado','Doble de prueba',color='infra')]], [('u','p','Depende de'),('g','p','Implementa','impl'),('f','p','Implementa','impl')])
svg_diagram('patron-facade','Patrón Facade · API pública de Sesiones',[[n('e','Evaluación y coaching','Necesita conversación cerrada'),n('h','Historial y progreso','Necesita sesiones del usuario')],[n('f','API pública de Sesiones','obtenerSesionFinalizada()','consultarSesionesPropias()')],[n('d','Internos de Sesiones','Entidades · casos de uso','Repositorio propio',color='data')]], [('e','f','Solicita'),('h','f','Consulta'),('f','d','Coordina')],note='Las llamadas cruzan la API pública; los consumidores no acceden a tablas internas.')
svg_diagram('patron-strategy','Patrón Strategy · Rúbricas comerciales',[[n('u','EvaluarSesion','Selecciona criterios de evaluación')],[n('p','«contrato» EstrategiaRubrica','obtenerCriterios()')],[n('s','RubricaProspeccion','Apertura · calificación',color='data'),n('d','RubricaDescubrimiento','Necesidades · preguntas',color='data'),n('c','RubricaCierre','Objeciones · siguiente paso',color='data')]], [('u','p','Usa'),('s','p','Implementa','impl'),('d','p','Implementa','impl'),('c','p','Implementa','impl')],note='Patrón previsto. Si solo cambian datos, usar configuración en lugar de clases adicionales.')
svg_diagram('patron-factory','Patrón Factory · Construcción de sesión',[[n('u','IniciarSimulacion','Usuario y cuota ya autorizados')],[n('f','FabricaSesion','crear(usuario, escenario, reserva)')],[n('s','SesionPractica','Estado inicial: PREPARADA','Datos obligatorios validados',color='data')]], [('u','f','Solicita creación'),('f','s','Construye')],note='Patrón previsto. La fábrica no invoca IA ni accede a la base de datos.')
svg_diagram('patron-observer','Patrón Observer · Avisos secundarios',[[n('e','EvaluarSesion','Resultado guardado y validado')],[n('v','EvaluacionCompletada','Evento en memoria')],[n('o','ObservadorNotificacion','Solicita aviso',color='infra'),n('n','ObservadorProgreso','Actualiza vista secundaria',color='infra')]], [('e','v','Publica tras persistir'),('v','o','Notifica'),('v','n','Notifica')],note='Futuro: eventos en memoria no garantizan entrega. La persistencia crítica no depende de observadores.')
svg_diagram('solid-modulo-sesiones','SOLID · Responsabilidades de Sesiones',[[n('p','ControladorSesiones','S: traduce HTTP',color='web')],[n('u','FinalizarSesion','S: coordina el cierre','D: depende de contratos')],[n('d','SesionPractica','S: valida estados',color='data'),n('r','RepositorioSesiones','I: operaciones de sesiones')],[n('a','RepositorioSupabase','O / L: implementación compatible',color='infra')]], [('p','u','Invoca'),('u','d','Aplica reglas'),('u','r','Usa'),('a','r','Implementa','impl')])

def sequence(name):
    w=1640;h=1260;xs=[110,390,670,950,1230,1510]; labels=['Web','API / casos de uso','API Sesiones','Repo. evaluaciones','EvaluadorGemini','Gemini']
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="a" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#475569"/></marker></defs><rect width="100%" height="100%" fill="white"/>']
    def t(x,y,s,size=19):out.append(f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="{size}" fill="#0F172A">{html.escape(s)}</text>')
    t(w/2,48,'Secuencia · Finalizar y evaluar una sesión',32);t(w/2,85,'Camino exitoso · solicitudes autenticadas · evaluación fuera del audio',21)
    for x,label in zip(xs,labels):
        out.append(f'<rect x="{x-105}" y="125" width="210" height="70" rx="10" fill="#DBEAFE" stroke="#64748B"/><path d="M{x} 195 V1150" stroke="#94A3B8" stroke-dasharray="8 7"/>');t(x,165,label,18)
    messages=[(0,1,'1. Finalizar sesión y enviar transcripción'),(1,2,'2. Validar propiedad y persistir cierre atómico'),(2,1,'3. Sesión finalizada'),(1,0,'4. Confirmar cierre'),(0,1,'5. Solicitar evaluación'),(1,2,'6. Obtener sesión finalizada propia'),(2,1,'7. Instantánea de transcripción'),(1,3,'8. Reservar evaluación única por sesión'),(3,1,'9. Reserva concedida'),(1,4,'10. Evaluar conversación mediante puerto'),(4,5,'11. Solicitar análisis'),(5,4,'12. Respuesta externa'),(4,1,'13. Resultado normalizado'),(1,3,'14. Validar y guardar COMPLETADA'),(3,1,'15. Guardado confirmado'),(1,0,'16. Mostrar métricas y recomendaciones')]
    for i,(a,b,label) in enumerate(messages):
        y=240+i*55;x1=xs[a];x2=xs[b];out.append(f'<path d="M{x1} {y} H{x2}" stroke="#475569" stroke-width="2" marker-end="url(#a)"/>');t((x1+x2)/2,y-12,label,18)
    t(w/2,1178,'Cierre repetido: devolver estado existente. Evaluación duplicada: devolver resultado o EN_PROCESO.',20)
    t(w/2,1215,'Error de IA: conservar conversación, registrar FALLIDA y permitir reintento controlado.',20);out.append('</svg>')
    (SRC/f'{name}.svg').write_text('\n'.join(out),encoding='utf-8')
for name in ['nivel4-secuencia','secuencia-finalizar-sesion']:sequence(name)
print(f'{len(list(SRC.glob(chr(42)+chr(46)+"svg")))} diagramas SVG generados.')


# Relaciones de larga distancia, trazadas por el margen para evitar atravesar tarjetas.
for name in ['nivel3-componentes', 'componentes', 'ArquitecturaMonoliticaCloserEnCapas']:
    p=SRC/f'{name}.svg'
    svg=p.read_text(encoding='utf-8')
    bus='<path d="M575 210 H25 V565 H1260 M300 565 V605 M780 565 V605 M1260 565 V605" fill="none" stroke="#475569" stroke-width="2"/>'
    arrows=''.join(f'<path d="M{x} 580 V605" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>' for x in [300,780,1260])
    label='<text x="55" y="550" font-family="Arial, sans-serif" font-size="18" fill="#0F172A">API REST invoca también Sesiones, Evaluación e Historial</text>'
    marker='<rect width="1560" height='
    end=svg.index('/>',svg.index(marker))+2
    svg=svg[:end]+bus+arrows+label+svg[end:]
    p.write_text(svg,encoding='utf-8')
for name in ['nivel4-clases','clases-modulo-sesiones']:
    p=SRC/f'{name}.svg'
    svg=p.read_text(encoding='utf-8')
    paths='<path d="M335 440 H25 V795 H300 V835 M1225 440 H1535 V795 H780 V835 M1535 795 H1260 V835" fill="none" stroke="#475569" stroke-width="2"/>'
    paths+=''.join(f'<path d="M{x} 810 V835" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>' for x in [300,780,1260])
    paths+='<text x="55" y="780" font-family="Arial, sans-serif" font-size="18" fill="#0F172A">FinalizarSesion usa su repositorio</text><text x="825" y="780" font-family="Arial, sans-serif" font-size="18" fill="#0F172A">EvaluarSesion usa repositorio y evaluador</text>'
    end=svg.index('/>',svg.index('<rect width="1560" height='))+2
    svg=svg[:end]+paths+svg[end:]
    p.write_text(svg,encoding='utf-8')


# ── Vistas de la implementación (Sprints 2 y 3). Las anteriores se conservan como propuesta del Sprint 1. ──
IMPL = 'Implementación · Closer (Sprints 2 y 3)'

svg_diagram('nivel2-contenedores-implementado', 'C4 · Nivel 2 · Contenedores implementados', [
 [n('web','Aplicación web','Next.js 16 · React 19 · TypeScript','Vercel o 2 réplicas en VPS',color='web')],
 [n('lb','Balanceador nginx','least_conn · failover','Límite por IP · gzip',color='infra'),n('voz','Gemini Live · voz','WSS directo desde el navegador','Token efímero bloqueado',color='ext')],
 [n('api','API Closer · NestJS 11','3 réplicas sin estado','Monolito modular · Clean Arch.'),n('redis','Redis 7','Caché · rate limit compartido',color='data')],
 [n('pool','PgBouncer / Supavisor','Pool de conexiones','Modo transacción',color='infra'),n('auth','Supabase Auth','JWT · Google OAuth','Código por correo',color='ext'),n('gem','Gemini · texto','Evaluación · coach','Extracción · escenarios',color='ext')],
 [n('db','PostgreSQL · Supabase','Migraciones Prisma','Índices por usuario',color='data')]],
 [('web','lb','HTTPS · /api'),('web','voz','WSS · audio'),('lb','api','HTTP · balanceo'),('api','redis','Caché'),('api','pool','SQL'),('api','auth','Verifica JWT (JWKS)'),('api','gem','Adaptador'),('pool','db','Conexiones reales')],
 subtitle=IMPL, note='La web también inicia sesión con Supabase Auth. Cloudflare (TLS, CDN, DNS) queda delante de la web y de nginx.')

svg_diagram('nivel3-componentes-implementado', 'C4 · Nivel 3 · Módulos de la API (implementados)', [
 [n('api','API REST · /api/v1','AuthGuard · RateLimitGuard','ValidationPipe · Swagger',color='web')],
 [n('id','identity','/me · onboarding','Verificación de JWT'),n('pr','profiles','Biblioteca de prospectos','CRUD por entidad'),n('pa','practice','Sesiones · simulaciones','Evaluación · coach · asistente')],
 [n('pu','Puertos de aplicación','CachePort · RateLimiterPort · repositorios','ConversationAiPort · LiveVoicePort')],
 [n('pg','Adaptadores Prisma','Repositorios PostgreSQL',color='infra'),n('rd','Adaptadores Redis','Caché · rate limit',color='infra'),n('ia','Adaptadores de IA','Gemini · simulado (pruebas)',color='infra')]],
 [('api','id','Invoca'),('api','pr','Invoca'),('api','pa','Invoca'),('id','pu','Usa'),('pr','pu','Usa'),('pa','pu','Usa'),('pg','pu','Implementa','impl'),('rd','pu','Implementa','impl'),('ia','pu','Implementa','impl')],
 subtitle=IMPL, note='También: support (contacto + webhook) y health (live · ready · metrics). ESLint impide que dominio y aplicación importen Prisma, Redis o Gemini.')
print('Vistas de implementación generadas.')
