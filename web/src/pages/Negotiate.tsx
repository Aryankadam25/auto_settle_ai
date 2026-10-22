import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useClaim } from '../context/ClaimContext';
import { counterAvailability, latestOffer, NEGOTIATION_RULES } from '../engine/negotiation';
import { checkPolicy } from '../engine/policyChecks';
import { formatINR, formatTime } from '../lib/format';
import type { ChatMessage } from '../types';

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'customer';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          mine
            ? 'rounded-br-sm bg-[#0B2545] text-white'
            : 'rounded-bl-sm border border-teal-200 bg-white text-[#0B2545]'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.offer && (
          <p className="mt-2 inline-block rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
            Offer: {formatINR(message.offer.amount)} · Round {message.offer.round}
          </p>
        )}
        <p className={`mt-1 text-[10px] ${mine ? 'text-slate-300' : 'text-slate-400'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function Negotiate() {
  const {
    claim,
    policy,
    messages,
    busy,
    error,
    clearError,
    openNegotiation,
    askQuestion,
    counterOffer,
    acceptOffer,
    escalate,
  } = useClaim();

  const [draft, setDraft] = useState('');
  const openedFor = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const claimId = claim?.id;
  const check = claim ? checkPolicy(policy, claim.estimate) : null;
  const reviewReasons = claim && check ? Array.from(new Set([...claim.escalationReasons, ...check.reviewReasons])) : [];
  const blocked = !!check && (check.blockers.length > 0 || reviewReasons.length > 0);
  const needsOpening =
    !!claim && !!claim.estimate && claim.offers.length === 0 && claim.status !== 'escalated' && claim.status !== 'settled';

  // Ask the backend for the opening offer exactly once per claim.
  useEffect(() => {
    if (!claimId || !needsOpening || blocked || openedFor.current === claimId) return;
    openedFor.current = claimId;
    openNegotiation().catch(() => undefined);
  }, [claimId, needsOpening, blocked, openNegotiation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, busy]);

  // ClaimGate guarantees a claim; this only narrows the type.
  if (!claim) return null;

  if (!claim.estimate) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Your offer</h1>
        <p className="text-slate-600">There is no estimate for this claim yet. Upload your photos first.</p>
        <Link
          to={`/claims/${claim.id}/upload`}
          className="inline-block rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
        >
          Upload photos
        </Link>
      </div>
    );
  }

  const latest = latestOffer(claim.offers);
  const settled = claim.status === 'settled' || latest?.state === 'accepted';
  const escalated = claim.status === 'escalated' || latest?.state === 'escalated';
  const active = !!latest && !settled && !escalated;
  const availability = counterAvailability(claim, policy?.idv);
  const canChat = !settled && !escalated && !blocked;

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    askQuestion(text).catch(() => undefined);
  };

  const requestHigher = () => {
    const text = draft.trim();
    setDraft('');
    counterOffer(text).catch(() => undefined);
  };

  const retryOpening = () => {
    clearError();
    openedFor.current = claim.id;
    openNegotiation().catch(() => undefined);
  };

  if (blocked && !escalated && !settled) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-bold">Your offer</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
          <p className="font-semibold">An adjuster needs to look at this claim before we can make an offer.</p>
          <ul className="mt-2 list-disc pl-5 space-y-0.5">
            {[...(check?.blockers ?? []), ...reviewReasons].map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => {
              escalate('Policy checks require adjuster review').catch(() => undefined);
            }}
            disabled={busy}
            className="rounded-lg bg-[#0B2545] px-5 py-3 font-semibold text-white hover:bg-[#13315c] disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send to adjuster'}
          </button>
          <Link
            to={`/claims/${claim.id}/result`}
            className="rounded-lg border-2 border-[#0B2545] px-5 py-3 font-semibold text-[#0B2545] hover:bg-slate-100"
          >
            Back to assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Your offer</h1>
        <span className="text-xs text-slate-500">Claim {claim.id}</span>
      </div>

      {/* Offer card */}
      <section className="rounded-2xl bg-[#0B2545] p-6 text-white">
        {latest ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-teal-200">
                {settled ? 'Settled amount' : escalated ? 'Last offer' : 'Current offer'}
              </p>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200">
                Round {latest.round} of {NEGOTIATION_RULES.MAX_ROUNDS}
              </span>
            </div>
            <p className="mt-2 text-4xl font-black tracking-tight">{formatINR(latest.amount)}</p>
            <p className="mt-1 text-xs text-slate-300">Based on your photos. Hidden damage cannot be seen.</p>
          </>
        ) : (
          <p className="text-sm text-teal-100" role="status">
            {busy ? 'Preparing your offer…' : 'Your offer will appear here.'}
          </p>
        )}
      </section>

      {settled && (
        <div className="rounded-xl border border-teal-300 bg-teal-50 p-4 text-sm text-teal-900">
          <p className="font-semibold">Offer accepted. Your claim is settled.</p>
          <Link to={`/claims/${claim.id}/audit`} className="mt-1 inline-block font-semibold text-teal-700 hover:underline">
            View the audit trail
          </Link>
        </div>
      )}

      {escalated && !settled && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">This claim has been sent to an adjuster.</p>
          {claim.escalationReasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              {claim.escalationReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <Link to={`/claims/${claim.id}/audit`} className="mt-1 inline-block font-semibold text-amber-800 hover:underline">
            View the audit trail
          </Link>
        </div>
      )}

      {/* Offer actions */}
      {active && (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                acceptOffer().catch(() => undefined);
              }}
              disabled={busy}
              className="flex-1 rounded-lg bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Accept {latest ? formatINR(latest.amount) : ''}
            </button>
            <button
              onClick={requestHigher}
              disabled={busy || !availability.allowed}
              className="flex-1 rounded-lg border-2 border-teal-600 bg-white py-3 font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
            >
              Ask for a higher offer
            </button>
          </div>
          {!availability.allowed && availability.reason && (
            <p className="text-sm text-slate-600">{availability.reason}</p>
          )}
          <button
            onClick={() => {
              escalate('Customer asked for an adjuster during negotiation').catch(() => undefined);
            }}
            disabled={busy}
            className="text-sm font-semibold text-[#0B2545] underline-offset-2 hover:underline disabled:opacity-50"
          >
            Talk to an adjuster instead
          </button>
        </section>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <span>{error}</span>
          <span className="flex shrink-0 gap-3">
            {needsOpening && !latest && (
              <button onClick={retryOpening} disabled={busy} className="font-semibold underline disabled:opacity-50">
                Try again
              </button>
            )}
            <button onClick={clearError} className="font-semibold underline">
              Dismiss
            </button>
          </span>
        </div>
      )}

      {/* Chat */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="max-h-96 min-h-[8rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && latest && (
            <MessageBubble
              message={{
                id: 'current-offer',
                role: 'assistant',
                text: `Your current offer is ${formatINR(latest.amount)} (round ${latest.round}). Ask me anything about it.`,
                timestamp: new Date().toISOString(),
              }}
            />
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {busy && <p className="text-xs text-slate-400">Thinking…</p>}
          <div ref={endRef} />
        </div>

        {canChat && (
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question about your claim"
              aria-label="Message"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13315c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}
        <p className="mt-3 text-[11px] text-slate-400">
          The assistant explains your claim. Offer amounts are set by our pricing rules and cannot be changed by chat.
        </p>
      </section>
    </div>
  );
}
