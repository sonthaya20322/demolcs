import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DemoMode, DemoRepository } from '../data/types'
import {
  bootstrapSession,
  resetCurrentSession,
  retryCloudBootstrap,
  type BootResult,
} from './bootstrap'

interface SessionContextValue {
  ready: boolean
  mode: DemoMode
  sessionId: string
  repository: DemoRepository | null
  canRetryCloud: boolean
  /** เหตุผลบูต/retry คลาวด์ล้ม (จาก BootResult) */
  bootError: string | null
  refreshKey: number
  bump: () => void
  resetDemo: () => Promise<void>
  retryCloud: () => Promise<void>
  busy: boolean
  /** error จากรีเซ็ตหรือ action อื่น */
  error: string | null
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<BootResult | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await bootstrapSession()
        if (!cancelled) {
          setBoot(result)
          setReady(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'ไม่สามารถเริ่มระบบสาธิตได้')
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const bump = useCallback(() => setRefreshKey((k) => k + 1), [])

  const resetDemo = useCallback(async () => {
    if (!boot) return
    setBusy(true)
    setError(null)
    try {
      const next = await resetCurrentSession(boot)
      setBoot(next)
      bump()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'รีเซ็ตไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }, [boot, bump])

  const retryCloud = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const next = await retryCloudBootstrap()
      setBoot(next)
      bump()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เชื่อมต่อคลาวด์ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }, [bump])

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      mode: boot?.mode ?? 'local',
      sessionId: boot?.sessionId ?? '',
      repository: boot?.repository ?? null,
      canRetryCloud: boot?.canRetryCloud ?? false,
      bootError: boot?.bootError ?? null,
      refreshKey,
      bump,
      resetDemo,
      retryCloud,
      busy,
      error,
    }),
    [ready, boot, refreshKey, bump, resetDemo, retryCloud, busy, error],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
