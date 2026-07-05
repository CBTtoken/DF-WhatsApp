// Flat lookup of whichever single plan was picked. Never sum two price fields together
// (a past bug summed the setup fee onto every plan, e.g. Founding Nomad showed R2,349
// instead of R750).
const PLAN_CENTS_CENTS: Record<string, number> = {
  diy: 1_199_00,
  done_for_you: 1_599_00,
  founding_nomad: 750_00,
  standard: 1_500_00,
};

export function calculateTotalCents(
  forkSelection: string | null | undefined,
  tierSelection: string | null | undefined
): number {
  const amount = tierSelection ? PLAN_CENTS_CENTS[tierSelection] : undefined;
  if (amount !== undefined) return amount;

  // Fallback if something upstream didn't set tier_selection correctly.
  return forkSelection === "re_biz_nomads" ? PLAN_CENTS_CENTS.founding_nomad : PLAN_CENTS_CENTS.done_for_you;
}

export function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}
