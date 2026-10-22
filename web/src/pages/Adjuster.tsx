import { useState } from 'react';

type EscalationReason = 'fraud' | 'severe damage' | 'over limit' | 'customer dispute';

type Claim = {
  id: string;
  customer: string;
  vehicle: string;
  estimate: number;
  reasons: EscalationReason[];
  priority: 'high' | 'medium' | 'low';
  age: string;
};

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'CL-3821',
    customer: 'Sarah Jenkins',
    vehicle: '2021 Toyota Corolla',
    estimate: 925,
    reasons: ['fraud', 'severe damage'],
    priority: 'high',
    age: '2h 14m',
  },
  {
    id: 'CL-3827',
    customer: 'Marcus Lee',
    vehicle: '2023 Honda Civic',
    estimate: 1340,
    reasons: ['over limit'],
    priority: 'medium',
    age: '4h 32m',
  },
  {
    id: 'CL-3844',
    customer: 'Priya Sharma',
    vehicle: '2020 BMW X3',
    estimate: 2120,
    reasons: ['severe damage', 'over limit'],
    priority: 'high',
    age: '1h 05m',
  },
  {
    id: 'CL-3850',
    customer: 'Daniel Porter',
    vehicle: '2019 Ford F-150',
    estimate: 580,
    reasons: ['customer dispute'],
    priority: 'low',
    age: '6h 50m',
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const REASON_COLORS: Record<string, string> = {
  fraud: 'bg-red-100 text-red-700',
  'severe damage': 'bg-orange-100 text-orange-700',
  'over limit': 'bg-purple-100 text-purple-700',
  'customer dispute': 'bg-blue-100 text-blue-700',
};

function DetailPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{claim.id} — {claim.customer}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold">✕</button>
        </div>

        {/* Photos placeholder */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-24 rounded flex items-center justify-center text-gray-400 text-xs">
              Photo {i}
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-1">Damage overlay</h3>
          <div className="bg-gray-100 h-40 rounded flex items-center justify-center text-gray-400 text-sm">
            Bounding box overlay placeholder
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-1">Estimate</h3>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Parts</span><span>$480</span></div>
              <div className="flex justify-between"><span>Labour</span><span>$320</span></div>
              <div className="flex justify-between"><span>Paint</span><span>$150</span></div>
              <hr />
              <div className="flex justify-between font-bold"><span>Total</span><span>${claim.estimate}</span></div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Policy</h3>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
              <div>Comprehensive</div>
              <div>Excess: $500</div>
              <div>Ceiling: $1,100</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Audit trail</h3>
          <div className="text-xs space-y-2 max-h-32 overflow-y-auto">
            {['Policy check passed', 'Upload: 5 photos', 'Damage detected (3 parts)', 'Estimate: $865', 'Negotiation round 1', 'Escalated to adjuster'].map((s, i) => (
              <div key={i} className="flex gap-2 text-gray-600"><span className="text-gray-300">●</span>{s}</div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Approve offer</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Set a different amount</button>
          <button className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-sm font-semibold transition-colors">Request more photos</button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdjusterQueue() {
  const [selected, setSelected] = useState<Claim | null>(null);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Adjuster Queue</h1>
        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">Demo mode</span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b">
              <th className="p-3 font-medium">Claim ID</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Vehicle</th>
              <th className="p-3 font-medium">Estimate</th>
              <th className="p-3 font-medium">Reasons</th>
              <th className="p-3 font-medium">Priority</th>
              <th className="p-3 font-medium">Age</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CLAIMS.map((claim) => (
              <tr
                key={claim.id}
                onClick={() => setSelected(claim)}
                className="border-b last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="p-3 font-medium">{claim.id}</td>
                <td className="p-3">{claim.customer}</td>
                <td className="p-3">{claim.vehicle}</td>
                <td className="p-3">${claim.estimate}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  {claim.reasons.map((r) => (
                    <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${REASON_COLORS[r]}`}>{r}</span>
                  ))}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${PRIORITY_COLORS[claim.priority]}`}>
                    {claim.priority}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{claim.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <DetailPanel claim={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}