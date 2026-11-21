import type { SimulationProspect } from '../types/simulation-types'

export const DEFAULT_SIMULATION_PROSPECT: SimulationProspect = {
  name: 'Ana García',
  role: 'Directora de Marketing',
  company: 'EcoVida',
}

export const SIMULATION_COPY = {
  helperText:
    'Habla con tu prospecto. La IA analizará tu desempeño en tiempo real simulando las objeciones.',
}

export function formatSimulationTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
