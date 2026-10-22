export const VITE_USE_MOCK = true;

// ----- Types -----

export interface PolicyInfo {
  policyNo: string;
  vehicle: string;
  year: number;
  variant: string;
  coverage: string;
  idv: number;
  zeroDep: boolean;
  claims: number;
  valid: boolean;
}

export interface ClaimDraft {
  policyNo: string;
  description: string;
  location: string;
  incidentDate: string;
}

export interface ClaimResult {
  claimId: string;
  status: "registered" | "processing" | "settled" | "rejected";
  createdAt: string;
}

export interface MediaUploadResult {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface DamageItem {
  part: string;
  severity: "minor" | "moderate" | "severe";
  repairCost: number;
  imageUrl?: string;
}

export interface Estimate {
  totalLabour: number;
  totalParts: number;
  grandTotal: number;
  currency: string;
}

export interface AssessmentResult {
  damages: DamageItem[];
  estimate: Estimate;
}

export interface OfferResult {
  round: number;
  offeredAmount: number;
  floor: number;
  ceiling: number;
  settled: boolean;
  acceptedAmount: number | null;
  totalRounds: number;
}

// ----- Mock helpers -----

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 500));
}

const mockPolicies: Record<string, PolicyInfo> = {
  "DEMO-1001": {
    policyNo: "DEMO-1001",
    vehicle: "Swift",
    year: 2021,
    variant: "ZXI+",
    coverage: "comprehensive",
    idv: 450000,
    zeroDep: true,
    claims: 0,
    valid: true,
  },
  "DEMO-1004": {
    policyNo: "DEMO-1004",
    vehicle: "City",
    year: 2018,
    variant: "VX",
    coverage: "comprehensive",
    idv: 380000,
    zeroDep: false,
    claims: 0,
    valid: true,
  },
  "DEMO-1005": {
    policyNo: "DEMO-1005",
    vehicle: "Seltos",
    year: 2023,
    variant: "HTX",
    coverage: "comprehensive",
    idv: 900000,
    zeroDep: true,
    claims: 2,
    valid: true,
  },
};

const mockDamages: DamageItem[] = [
  { part: "Front Bumper", severity: "moderate", repairCost: 8500 },
  { part: "Headlight (Left)", severity: "severe", repairCost: 12000 },
  { part: "Bonnet", severity: "minor", repairCost: 3200 },
  { part: "Radiator Grille", severity: "moderate", repairCost: 4800 },
];

const mockEstimate: Estimate = {
  totalLabour: 5500,
  totalParts: 28500,
  grandTotal: 34000,
  currency: "INR",
};

// ----- API functions -----

export async function verifyPolicy(policyNo: string): Promise<PolicyInfo> {
  if (!VITE_USE_MOCK) {
    throw new Error("Live endpoint not implemented");
  }
  const policy = mockPolicies[policyNo];
  if (!policy) {
    return delay({} as PolicyInfo);
  }
  return delay(policy);
}

export async function createClaim(draft: ClaimDraft): Promise<ClaimResult> {
  if (!VITE_USE_MOCK) {
    throw new Error("Live endpoint not implemented");
  }
  return delay({
    claimId: `CLM-${Date.now()}`,
    status: "registered" as const,
    createdAt: new Date().toISOString(),
  });
}

export async function uploadMedia(
  _claimId: string,
  _file: File
): Promise<MediaUploadResult> {
  if (!VITE_USE_MOCK) {
    throw new Error("Live endpoint not implemented");
  }
  return delay({
    url: `https://cdn.mock.io/uploads/${_file.name}`,
    filename: _file.name,
    mimeType: _file.type || "image/jpeg",
    sizeBytes: _file.size,
  });
}

export async function assessClaim(_claimId: string): Promise<AssessmentResult> {
  if (!VITE_USE_MOCK) {
    throw new Error("Live endpoint not implemented");
  }
  return delay({ damages: mockDamages, estimate: mockEstimate });
}

export async function getOffer(_claimId: string): Promise<OfferResult> {
  if (!VITE_USE_MOCK) {
    throw new Error("Live endpoint not implemented");
  }
  return delay({
    round: 1,
    offeredAmount: 23800,
    floor: 23800,
    ceiling: 30600,
    settled: false,
    acceptedAmount: null,
    totalRounds: 3,
  });
}