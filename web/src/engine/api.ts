import type { AuditEntry, Claim, EscalatedClaim, Offer, Policy } from '../types'

/**
 * Typed client for the FastAPI service. Contract (the backend in Step 2 implements exactly this):
 *
 *   POST /verify                 { policy_no?, reg_no?, mobile? }        -> { policy }
 *   POST /claims                 { policy_no }                           -> { claim, audit }
 *   GET  /claims/{id}                                                    -> { claim, audit }
 *   POST /assess                 multipart: claim_id, files[]            -> { claim, audit }
 *   POST /chat                   { claim_id, action, message }           -> { reply, offer?, claim, audit }
 *   POST /claims/{id}/escalate   { reason }                              -> { claim, audit }
 *   GET  /adjuster/queue                                                 -> EscalatedClaim[]
 *
 * Requests use snake_case; responses use the camelCase shapes in src/types.ts.
 * Damage boxes are normalised: x, y = top-left corner, x / y / w / h in the range 0..1.
 */

export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'
).replace(/\/+$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface PolicyQuery {
  policyNo?: string
  regNo?: string
  mobile?: string
}

export interface ClaimBundle {
  claim: Claim
  audit: AuditEntry[]
}

export interface ChatReply extends ClaimBundle {
  reply: string
  offer?: Offer
}

/**
 * open    - backend makes the opening offer (round 1)
 * message - the customer asks a question; money never changes
 * counter - the customer asks for more; code raises the offer by the fixed bump (or escalates)
 * accept  - the customer accepts the latest offer
 */
export type ChatAction = 'open' | 'message' | 'counter' | 'accept'

/** Makes a media URL returned by the backend (often relative, e.g. /media/..) loadable by the browser. */
export function resolveMediaUrl(url: string): string {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function withAbsoluteMedia<T extends { files: Claim['files'] }>(item: T): T {
  return { ...item, files: item.files.map((f) => ({ ...f, url: resolveMediaUrl(f.url) })) }
}

function normalizeBundle(bundle: ClaimBundle): ClaimBundle {
  return { claim: withAbsoluteMedia(bundle.claim), audit: bundle.audit ?? [] }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown; message?: unknown }
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      const msgs = body.detail
        .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : ''))
        .filter(Boolean)
      if (msgs.length > 0) return msgs.join('; ')
    }
    if (typeof body.message === 'string') return body.message
  } catch {
    // body was not JSON
  }
  return `Request failed (${res.status}).`
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.')
    }
    throw new ApiError(`Cannot reach the assessment service at ${API_BASE_URL}. Is the FastAPI server running?`)
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) throw new ApiError(await readError(res), res.status)
  return (await res.json()) as T
}

function postJson<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    timeoutMs,
  )
}

export async function verifyPolicy(query: PolicyQuery): Promise<Policy> {
  const res = await postJson<{ policy: Policy }>('/verify', {
    policy_no: query.policyNo?.trim() || undefined,
    reg_no: query.regNo?.replace(/\s+/g, '').toUpperCase() || undefined,
    mobile: query.mobile?.replace(/\D+/g, '') || undefined,
  })
  return res.policy
}

export async function createClaim(policyNo: string): Promise<ClaimBundle> {
  return normalizeBundle(await postJson<ClaimBundle>('/claims', { policy_no: policyNo }))
}

export async function getClaim(claimId: string): Promise<ClaimBundle> {
  return normalizeBundle(await request<ClaimBundle>(`/claims/${encodeURIComponent(claimId)}`))
}

/** Runs the damage detector + second-opinion model + pricing engine. Can take a while on first call. */
export async function assessClaim(claimId: string, files: File[]): Promise<ClaimBundle> {
  const form = new FormData()
  form.append('claim_id', claimId)
  files.forEach((file) => form.append('files', file))
  return normalizeBundle(await request<ClaimBundle>('/assess', { method: 'POST', body: form }, 180_000))
}

export async function chat(claimId: string, action: ChatAction, message: string): Promise<ChatReply> {
  const reply = await postJson<ChatReply>('/chat', { claim_id: claimId, action, message }, 60_000)
  return { ...reply, ...normalizeBundle(reply) }
}

export async function escalateClaim(claimId: string, reason: string): Promise<ClaimBundle> {
  return normalizeBundle(await postJson<ClaimBundle>(`/claims/${encodeURIComponent(claimId)}/escalate`, { reason }))
}

export async function getAdjusterQueue(): Promise<EscalatedClaim[]> {
  const queue = await request<EscalatedClaim[]>('/adjuster/queue')
  return queue.map(withAbsoluteMedia)
}
