import { useState } from 'react';

type AuditEntry = {
  time: string;
  actor: 'Customer' | 'AI model' | 'Policy engine' | 'Verifier' | 'Adjuster';
  input: string;
  output: string;
  confidence?: number;
  floor?: number;
  ceiling?: number;
};

const MOCK_AUDIT: AuditEntry[] = [
  { time: '2026-10-21 09:01:12', actor: 'Policy engine', input: 'Policy ID: POL-3842', output: 'Active, comprehensive cover, $500 excess', floor: 320, ceiling: 1800 },
  { time: '2026-10-21 09:02:05', actor: 'Customer', input: 'Uploaded 5 photos', output: '3 passed, 1 blur (rejected), 1 fraud-flagged', confidence: 0.91 },
  { time: '2026-10-21 09:02:48', actor: 'AI model', input: '5 images analyzed', output: 'Detected: bumper scratch, hood dent, headlight crack', confidence: 0.87 },
  { time: '2026-10-21 09:03:22', actor: 'AI model', input: 'Damage map + regional rates', output: 'Estimate: $865 (parts $480, labour $320, paint $150)', confidence: 0.84, floor: 400, ceiling: 1300 },
  { time: '2026-10-21 09:04:01', actor: 'Policy engine', input: 'Estimate $865 vs policy limits', output: 'Approved up to $900 for negotiation', floor: 550, ceiling: 1100 },
  { time: '2026-10-21 09:05:30', actor: 'Customer', input: 'Countered at $950', output: 'Counter offer: $950' },
  { time: '2026-10-21 09:06:10', actor: 'AI model', input: 'Counter $950, policy ceiling $1100', output: 'New offer: $925', confidence: 0.79, floor: 550, ceiling: 1100 },
  { time: '2026-10-21 09:07:00', actor: 'Verifier', input: 'Final review triggered', output: 'All checks passed, fraud score: 0.02', confidence: 0.98 },
  { time: '2026-10-21 09:08:15', actor: 'Adjuster', input: 'Manual override requested', output: 'Approved at $925', confidence: 1.0 },
];

const ACTOR_COLORS: Record<string, string> = {
  Customer: 'bg-blue-500',
  'AI model': 'bg-purple-500',
  'Policy engine': 'bg-green-500',
  Verifier: 'bg-yellow-500',
  Adjuster: 'bg-red-500',
};

export default function Audit() {
  const [showLimits, setShowLimits] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(MOCK_AUDIT, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-trail.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLimits((v) => !v)}
            className={`text-sm px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              showLimits ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600'
            }`}
          >
            {showLimits ? 'Hide internal limits' : 'Show internal limits'}
          </button>
          <button
            onClick={handleDownload}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-semibold transition-colors"
          >
            Download JSON
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
        {MOCK_AUDIT.map((entry, i) => (
          <div key={i} className="relative">
            {/* Dot */}
            <div
              className={`absolute -left-[2.15rem] top-1 w-4 h-4 rounded-full border-2 border-white ${ACTOR_COLORS[entry.actor]}`}
            />
            {/* Card */}
            <div className="bg-white border rounded-lg p-4 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{entry.time}</span>
                <span className={`text-white text-[10px] px-1.5 py-0.5 rounded ${ACTOR_COLORS[entry.actor]}`}>
                  {entry.actor}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Input:</span> {entry.input}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Output:</span> {entry.output}
              </div>
              {(entry.confidence !== undefined || (showLimits && (entry.floor !== undefined || entry.ceiling !== undefined))) && (
                <div className="flex gap-4 text-xs text-gray-400 pt-1">
                  {entry.confidence !== undefined && (
                    <span>Confidence: {Math.round(entry.confidence * 100)}%</span>
                  )}
                  {showLimits && entry.floor !== undefined && (
                    <span>Floor: ${entry.floor}</span>
                  )}
                  {showLimits && entry.ceiling !== undefined && (
                    <span>Ceiling: ${entry.ceiling}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}