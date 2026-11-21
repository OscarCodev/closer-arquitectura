import type { ProspectProfile } from '@/app/setup/types/setup-types'

export type SimulationProspect = Pick<ProspectProfile, 'name' | 'role' | 'company'>

export type SimulationControls = {
  isMicMuted: boolean
  isAnalyzing: boolean
}
