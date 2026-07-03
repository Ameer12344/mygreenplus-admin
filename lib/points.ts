// Single source of truth for converting recycled weight into eco points.
//
// Today this is called from the admin "Log Drop-off" action (manual demo entry).
// Later, when real RVM/QR-scan hardware exists, the machine's webhook/edge
// function should call the SAME logic (or insert into drop_off_history with
// the same shape) so points are always calculated consistently no matter
// the source.

export const POINTS_PER_KG: Record<string, number> = {
  plastic: 10,
  aluminium: 15,
  glass: 5,
  paper: 3,
};

export const DEFAULT_POINTS_PER_KG = 5; // fallback for 'other' / unrecognised material

export function pointsPerKgFor(materialType: string | null | undefined): number {
  if (!materialType) return DEFAULT_POINTS_PER_KG;
  return POINTS_PER_KG[materialType] ?? DEFAULT_POINTS_PER_KG;
}

export function calculatePoints(materialType: string | null | undefined, weightKg: number): number {
  if (!weightKg || weightKg <= 0) return 0;
  return Math.round(weightKg * pointsPerKgFor(materialType));
}
