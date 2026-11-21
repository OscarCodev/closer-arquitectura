import { Logger } from '@nestjs/common'

// Las advertencias esperadas (IA caída, Redis caído) no ensucian la salida de las pruebas.
Logger.overrideLogger(false)
