import {
  createCloudRepository,
  createCloudSessionWithRetry,
  sessionStillValid,
} from '../data/cloudRepository'
import type { DemoMode, DemoRepository } from '../data/types'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  clearLocalDb,
  createFreshLocalDb,
  createLocalRepository,
  loadLocalDb,
  saveLocalDb,
  type LocalDb,
} from '../data/localStore'

const SESSION_KEY = 'demolcs_session_id'
const MODE_KEY = 'demolcs_mode'

export interface BootResult {
  mode: DemoMode
  sessionId: string
  repository: DemoRepository
  canRetryCloud: boolean
}

let localDbHolder: LocalDb | null = null

function getLocalDb(): LocalDb {
  if (!localDbHolder) {
    localDbHolder = loadLocalDb() ?? createFreshLocalDb()
    saveLocalDb(localDbHolder)
  }
  return localDbHolder
}

function setLocalDb(db: LocalDb): void {
  localDbHolder = db
  saveLocalDb(db)
}

function bootLocal(): BootResult {
  const existing = loadLocalDb()
  if (existing && new Date(existing.expires_at).getTime() > Date.now()) {
    localDbHolder = existing
  } else {
    clearLocalDb()
    localDbHolder = createFreshLocalDb()
    saveLocalDb(localDbHolder)
  }
  localStorage.setItem(SESSION_KEY, localDbHolder.session_id)
  localStorage.setItem(MODE_KEY, 'local')
  return {
    mode: 'local',
    sessionId: localDbHolder.session_id,
    repository: createLocalRepository(getLocalDb, setLocalDb),
    canRetryCloud: isSupabaseConfigured(),
  }
}

export async function bootstrapSession(): Promise<BootResult> {
  if (!isSupabaseConfigured()) {
    return bootLocal()
  }

  try {
    const storedId = localStorage.getItem(SESSION_KEY)
    const storedMode = localStorage.getItem(MODE_KEY) as DemoMode | null

    if (storedId && storedMode === 'cloud') {
      const valid = await sessionStillValid(storedId)
      if (valid) {
        const sessionRef = { id: storedId }
        const repo = createCloudRepository(sessionRef)
        await repo.touch()
        return {
          mode: 'cloud',
          sessionId: storedId,
          repository: repo,
          canRetryCloud: true,
        }
      }
    }

    const newId = await createCloudSessionWithRetry(2)
    localStorage.setItem(SESSION_KEY, newId)
    localStorage.setItem(MODE_KEY, 'cloud')
    const sessionRef = { id: newId }
    return {
      mode: 'cloud',
      sessionId: newId,
      repository: createCloudRepository(sessionRef),
      canRetryCloud: true,
    }
  } catch {
    return bootLocal()
  }
}

export async function retryCloudBootstrap(): Promise<BootResult> {
  if (!isSupabaseConfigured()) {
    return bootLocal()
  }
  try {
    const newId = await createCloudSessionWithRetry(2)
    localStorage.setItem(SESSION_KEY, newId)
    localStorage.setItem(MODE_KEY, 'cloud')
    clearLocalDb()
    localDbHolder = null
    const sessionRef = { id: newId }
    return {
      mode: 'cloud',
      sessionId: newId,
      repository: createCloudRepository(sessionRef),
      canRetryCloud: true,
    }
  } catch {
    return bootLocal()
  }
}

export async function resetCurrentSession(current: BootResult): Promise<BootResult> {
  const newId = await current.repository.reset()
  localStorage.setItem(SESSION_KEY, newId)
  localStorage.setItem(MODE_KEY, current.mode)
  if (current.mode === 'local') {
    return {
      ...current,
      sessionId: newId,
      repository: createLocalRepository(getLocalDb, setLocalDb),
    }
  }
  const sessionRef = { id: newId }
  return {
    ...current,
    sessionId: newId,
    repository: createCloudRepository(sessionRef),
  }
}
