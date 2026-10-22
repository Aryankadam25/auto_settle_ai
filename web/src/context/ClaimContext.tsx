import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as api from '../engine/api'
import { counterAvailability, latestOffer, offerCeiling, validateOfferHistory } from '../engine/negotiation'
import { checkPolicy } from '../engine/policyChecks'
import type { AuditEntry, ChatMessage, Claim, Offer, Policy } from '../types'

const STORAGE_KEY = 'autosettle.session.v1'

interface StoredSession {
  policy: Policy | null
  claimId: string | null
  messages: ChatMessage[]
}

function readSession(): StoredSession {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSession>
      return {
        policy: parsed.policy ?? null,
        claimId: parsed.claimId ?? null,
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      }
    }
  } catch {
    // storage unavailable or corrupt: start fresh
  }
  return { policy: null, claimId: null, messages: [] }
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeMessage(role: ChatMessage['role'], text: string, offer?: Offer): ChatMessage {
  return { id: uid(), role, text, offer, timestamp: new Date().toISOString() }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

export interface ClaimContextValue {
  policy: Policy | null
  claim: Claim | null
  audit: AuditEntry[]
  messages: ChatMessage[]
  /** True while any request is in flight. Disable buttons on this. */
  busy: boolean
  /** Last error message. Every action below also throws, so pages may catch or just show this. */
  error: string | null

  verifyPolicy: (query: api.PolicyQuery) => Promise<Policy>
  /** Creates a claim for the verified policy. Refuses expired / third-party policies. */
  startClaim: (policy?: Policy) => Promise<Claim>
  uploadAndAssess: (files: File[]) => Promise<Claim>
  loadClaim: (id: string) => Promise<void>
  /** Asks the backend for the opening (round 1) offer. */
  openNegotiation: () => Promise<void>
  askQuestion: (text: string) => Promise<void>
  /** Asks for a higher offer. Amount is decided by code (+₹500/round), never by chat text. */
  counterOffer: (text?: string) => Promise<void>
  acceptOffer: () => Promise<void>
  escalate: (reason: string) => Promise<void>
  reset: () => void
  clearError: () => void
}

const ClaimContext = createContext<ClaimContextValue | null>(null)

export function ClaimProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readSession)

  const [policy, setPolicy] = useState<Policy | null>(initial.policy)
  const [claim, setClaim] = useState<Claim | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs mirror state so async actions always see the latest values (they are updated synchronously).
  const policyRef = useRef<Policy | null>(initial.policy)
  const claimRef = useRef<Claim | null>(null)
  const busyRef = useRef(false)
  const messagesOwnerRef = useRef<string | null>(initial.claimId)

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ policy, claimId: messagesOwnerRef.current, messages } satisfies StoredSession),
      )
    } catch {
      // storage unavailable: the session just will not survive a reload
    }
  }, [policy, claim?.id, messages])

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    if (busyRef.current) throw new Error('Please wait, the previous request is still running.')
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      return await task()
    } catch (err) {
      setError(messageOf(err))
      throw err
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [])

  /**
   * The single place server data enters state. Any offer history that breaks the
   * money rules (+₹500/round, ceiling, round limit) is rejected here, so the UI can
   * never display it.
   */
  const commitBundle = useCallback((bundle: api.ClaimBundle) => {
    const next = bundle.claim
    if (next.offers.length > 0) {
      if (!next.estimate) throw new Error('Rejected: an offer arrived without an estimate.')
      const ceiling = offerCeiling(next.estimate, policyRef.current?.idv)
      const result = validateOfferHistory(next.offers, ceiling)
      if (!result.ok) throw new Error(`Offer rejected by the rules engine: ${result.problems[0]}`)
    }

    if (messagesOwnerRef.current !== next.id) {
      messagesOwnerRef.current = next.id
      setMessages([])
    }
    claimRef.current = next
    setClaim(next)
    setAudit(bundle.audit)
  }, [])

  const verifyPolicy = useCallback(
    (query: api.PolicyQuery) =>
      run(async () => {
        const found = await api.verifyPolicy(query)
        policyRef.current = found
        setPolicy(found)
        return found
      }),
    [run],
  )

  const startClaim = useCallback(
    (policyArg?: Policy) =>
      run(async () => {
        const active = policyArg ?? policyRef.current
        if (!active) throw new Error('Verify your policy before starting a claim.')
        const gate = checkPolicy(active)
        if (gate.blockers.length > 0) throw new Error(gate.blockers[0])
        policyRef.current = active
        setPolicy(active)
        const bundle = await api.createClaim(active.policyNo)
        commitBundle(bundle)
        return bundle.claim
      }),
    [run, commitBundle],
  )

  const uploadAndAssess = useCallback(
    (files: File[]) =>
      run(async () => {
        const current = claimRef.current
        if (!current) throw new Error('Start a claim before uploading photos.')
        if (files.length === 0) throw new Error('Add at least one photo.')
        const bundle = await api.assessClaim(current.id, files)
        commitBundle(bundle)
        return bundle.claim
      }),
    [run, commitBundle],
  )

  const loadClaim = useCallback(
    (id: string) =>
      run(async () => {
        const bundle = await api.getClaim(id)
        if (policyRef.current?.policyNo !== bundle.claim.policyNo) {
          policyRef.current = null
          setPolicy(null)
          try {
            const found = await api.verifyPolicy({ policyNo: bundle.claim.policyNo })
            policyRef.current = found
            setPolicy(found)
          } catch {
            // carry on without the policy; IDV-based checks are skipped
          }
        }
        commitBundle(bundle)
      }),
    [run, commitBundle],
  )

  /** One conversational round-trip. Must be called inside run(). */
  const exchange = useCallback(
    async (action: api.ChatAction, text: string, echo?: string) => {
      const current = claimRef.current
      if (!current) throw new Error('There is no active claim.')
      const typed = text.trim()
      const shown = typed || echo
      if (shown) setMessages((prev) => [...prev, makeMessage('customer', shown)])
      const res = await api.chat(current.id, action, typed)
      commitBundle(res)
      setMessages((prev) => [...prev, makeMessage('assistant', res.reply, res.offer)])
    },
    [commitBundle],
  )

  const openNegotiation = useCallback(() => run(() => exchange('open', '')), [run, exchange])

  const askQuestion = useCallback(
    (text: string) =>
      run(async () => {
        if (!text.trim()) throw new Error('Type a question first.')
        await exchange('message', text)
      }),
    [run, exchange],
  )

  const counterOffer = useCallback(
    (text = '') =>
      run(async () => {
        const availability = counterAvailability(claimRef.current, policyRef.current?.idv)
        if (!availability.allowed) throw new Error(availability.reason ?? 'A higher offer is not available.')
        await exchange('counter', text, 'Could you improve your offer?')
      }),
    [run, exchange],
  )

  const acceptOffer = useCallback(
    () =>
      run(async () => {
        const latest = claimRef.current ? latestOffer(claimRef.current.offers) : undefined
        if (!latest) throw new Error('There is no offer to accept yet.')
        if (latest.state === 'accepted') throw new Error('This offer has already been accepted.')
        await exchange('accept', '', 'I accept this offer.')
      }),
    [run, exchange],
  )

  const escalate = useCallback(
    (reason: string) =>
      run(async () => {
        const current = claimRef.current
        if (!current) throw new Error('There is no active claim.')
        commitBundle(await api.escalateClaim(current.id, reason))
      }),
    [run, commitBundle],
  )

  const reset = useCallback(() => {
    policyRef.current = null
    claimRef.current = null
    messagesOwnerRef.current = null
    setPolicy(null)
    setClaim(null)
    setAudit([])
    setMessages([])
    setError(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<ClaimContextValue>(
    () => ({
      policy,
      claim,
      audit,
      messages,
      busy,
      error,
      verifyPolicy,
      startClaim,
      uploadAndAssess,
      loadClaim,
      openNegotiation,
      askQuestion,
      counterOffer,
      acceptOffer,
      escalate,
      reset,
      clearError,
    }),
    [
      policy,
      claim,
      audit,
      messages,
      busy,
      error,
      verifyPolicy,
      startClaim,
      uploadAndAssess,
      loadClaim,
      openNegotiation,
      askQuestion,
      counterOffer,
      acceptOffer,
      escalate,
      reset,
      clearError,
    ],
  )

  return <ClaimContext.Provider value={value}>{children}</ClaimContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClaim(): ClaimContextValue {
  const ctx = useContext(ClaimContext)
  if (!ctx) throw new Error('useClaim must be used inside <ClaimProvider>.')
  return ctx
}
