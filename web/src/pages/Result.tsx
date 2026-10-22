import { Link } from 'react-router-dom';
import { useClaim } from '../context/ClaimContext';
import { checkPolicy } from '../engine/policyChecks';
import { formatINR, formatPercent } from '../lib/format';
import type { Damage, UploadedFile } from '../types';

const SEVERITY_BADGE: Record<Damage['severity'], string> = {
  minor: 'bg-teal-100 text-teal-800',
  moderate: 'bg-amber-100 text-amber-800',
  severe: 'bg-red-100 text-red-800',
};

const SEVERITY_BOX: Record<Damage['severity'], string> = {
  minor: 'border-teal-400',
  moderate: 'border-amber-400',
  severe: 'border-red-500',
};

function SeverityBadge({ level }: { level: Damage['severity'] }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SEVERITY_BADGE[level]}`}>
      {level}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value > 0.85 ? 'bg-teal-500' : value > 0.65 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{formatPercent(value)}</span>
    </div>
  );
}

/** Photo with the detector's boxes. Boxes are normalised (0..1), x/y = top-left corner. */
function AnnotatedPhoto({ photo, damages }: { photo?: UploadedFile; damages: Damage[] }) {
  if (!photo) {
    return (
      <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center h-64 text-slate-400 text-sm">
        No photo available
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      <img src={photo.url} alt={`Uploaded photo: ${photo.name}`} className="block w-full h-auto" />
      {damages.map((d, i) =>
        // The backend sends an empty box when a part was only found in a different photo.
        d.box.w * d.box.h <= 0 ? null : (
          <div
            key={i}
            className={`absolute border-2 ${SEVERITY_BOX[d.severity]}`}
            style={{
              left: `${d.box.x * 100}%`,
              top: `${d.box.y * 100}%`,
              width: `${d.box.w * 100}%`,
              height: `${d.box.h * 100}%`,
            }}
          >
            <span className="absolute -top-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-br bg-[#0B2545] text-[10px] font-bold text-white">
              {i + 1}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

export default function Result() {
  const { claim, policy, busy, error, escalate } = useClaim();

  // ClaimGate guarantees a claim; this only narrows the type.
  if (!claim) return null;

  const estimate = claim.estimate;
  if (!estimate) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Damage Assessment</h1>
        <p className="text-slate-600">This claim has not been assessed yet. Upload your photos first.</p>
        <Link
          to={`/claims/${claim.id}/upload`}
          className="inline-block rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
        >
          Upload photos
        </Link>
      </div>
    );
  }

  const check = checkPolicy(policy, estimate);
  const reviewReasons = Array.from(new Set([...claim.escalationReasons, ...check.reviewReasons]));
  const escalated = claim.status === 'escalated';
  const settled = claim.status === 'settled';
  const needsReview = reviewReasons.length > 0 || escalated;
  const canGetOffer = check.blockers.length === 0 && !needsReview && !settled;

  const photo = claim.files.find((f) => f.qualityPassed) ?? claim.files[0];
  const flaggedFiles = claim.files.filter((f) => !f.qualityPassed || f.fraudFlag);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Damage Assessment</h1>
        <span className="text-xs text-slate-500">Claim {claim.id}</span>
      </div>

      {check.blockers.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <p className="font-semibold">This claim cannot be settled automatically</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {check.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {check.blockers.length === 0 && needsReview && !settled && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p className="font-semibold">
            {escalated ? 'An adjuster is reviewing this claim' : 'An adjuster needs to review this claim'}
          </p>
          {reviewReasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              {reviewReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {settled && (
        <div className="rounded-xl border border-teal-300 bg-teal-50 p-4 text-sm text-teal-900">
          <p className="font-semibold">This claim is settled.</p>
        </div>
      )}

      {flaggedFiles.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Photo checks</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {flaggedFiles.map((f) => (
              <li key={f.id}>
                {f.name}: {f.fraudFlag ?? f.qualityMessage ?? 'did not pass the quality check'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnnotatedPhoto photo={photo} damages={claim.damages} />

      {/* Damage table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Damage table</h2>
        {claim.damages.length === 0 ? (
          <p className="text-sm text-slate-500">No damage was detected in the photos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2 pr-3 w-8">#</th>
                  <th className="pb-2 pr-4">Part</th>
                  <th className="pb-2 pr-4">Damage</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Confidence</th>
                  <th className="pb-2">Second check</th>
                </tr>
              </thead>
              <tbody>
                {claim.damages.map((d, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{d.part}</td>
                    <td className="py-3 pr-4">{d.damageType}</td>
                    <td className="py-3 pr-4">
                      <SeverityBadge level={d.severity} />
                    </td>
                    <td className="py-3 pr-4 min-w-[8rem]">
                      <ConfidenceBar value={d.confidence} />
                    </td>
                    <td className="py-3 text-xs">
                      {d.vlmAgrees ? (
                        <span className="font-semibold text-teal-700">Agrees</span>
                      ) : (
                        <span className="font-semibold text-amber-700">Disagrees</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cost breakdown */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Cost breakdown</h2>
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex justify-between">
            <span>Parts</span>
            <span className="font-medium">{formatINR(estimate.parts)}</span>
          </div>
          <div className="flex justify-between">
            <span>Labour</span>
            <span className="font-medium">{formatINR(estimate.labour)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paint</span>
            <span className="font-medium">{formatINR(estimate.paint)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Depreciation</span>
            <span className="font-medium">−{formatINR(estimate.depreciation)}</span>
          </div>
          <hr />
          <div className="flex justify-between text-lg font-bold text-[#0B2545]">
            <span>Estimate</span>
            <span>{formatINR(estimate.total)}</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            {policy?.zeroDep
              ? 'Your policy has zero-depreciation cover, so no depreciation is deducted on replaced parts.'
              : 'Replaced parts are depreciated by 50%.'}
          </p>
          <p className="text-xs text-slate-400 italic">Estimate based on photos. Hidden damage cannot be seen.</p>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {canGetOffer ? (
          <Link
            to={`/claims/${claim.id}/negotiate`}
            className="flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Get my offer
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="flex-1 cursor-not-allowed text-center rounded-lg bg-slate-200 py-3 font-semibold text-slate-500"
          >
            Get my offer
          </span>
        )}
        <button
          onClick={() => {
            escalate('Customer requested adjuster review').catch(() => undefined);
          }}
          disabled={busy || escalated || settled}
          className="flex-1 rounded-lg border-2 border-[#0B2545] bg-white py-3 font-semibold text-[#0B2545] transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white"
        >
          {escalated ? 'Sent to adjuster' : busy ? 'Sending…' : 'Send to adjuster'}
        </button>
      </div>

      <p className="text-center text-sm">
        <Link to={`/claims/${claim.id}/audit`} className="font-semibold text-teal-700 hover:underline">
          View the audit trail
        </Link>
      </p>
    </div>
  );
}
