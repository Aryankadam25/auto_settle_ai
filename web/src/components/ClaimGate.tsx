import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { useClaim } from '../context/ClaimContext'

/**
 * Wraps every /claims/:id/* route. Makes sure the claim in the URL is loaded into
 * ClaimContext (e.g. after a page refresh) before the page renders.
 */
export default function ClaimGate() {
  const { id } = useParams<{ id: string }>()
  const { claim, loadClaim } = useClaim()
  const requested = useRef<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null)

  const ready = !!id && claim?.id === id

  useEffect(() => {
    if (!id || ready || requested.current === id) return
    requested.current = id
    loadClaim(id).catch((err: unknown) => {
      setFailure({ id, message: err instanceof Error ? err.message : 'Could not load this claim.' })
    })
  }, [id, ready, loadClaim, attempt])

  if (ready) return <Outlet />

  if (failure && failure.id === id) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
          <h1 className="text-lg font-bold text-red-900">We could not open this claim</h1>
          <p className="text-sm text-red-800">{failure.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                requested.current = null
                setFailure(null)
                setAttempt((n) => n + 1)
              }}
              className="rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13315c]"
            >
              Try again
            </button>
            <Link
              to="/verify"
              className="rounded-lg border border-[#0B2545] px-4 py-2 text-sm font-semibold text-[#0B2545] hover:bg-slate-100"
            >
              Start a new claim
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-center text-sm text-slate-500" role="status">
      Loading your claim…
    </div>
  )
}
