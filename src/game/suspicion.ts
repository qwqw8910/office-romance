import { tuning } from './tuning'

export function addSuspicion(current: number): number {
  return Math.min(tuning.suspicion.max, current + 1)
}

export function isBusted(suspicion: number): boolean {
  return suspicion >= tuning.suspicion.max
}
