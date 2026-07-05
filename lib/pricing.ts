// Pricing assumption (per CLAUDE.md section 5, Step 2 fork copy: RE:Biz Nomads is framed as
// "same professional webpage, plus the community" — i.e. it replaces the base DigitalFlyer
// membership rather than stacking on top of it). The Done For You setup fee always applies.
// Confirm with the business owner and adjust here if this reading is wrong — this is the
// only place the amounts are calculated.
const MEMBERSHIP_CENTS = 1_199_00;
const SETUP_FEE_CENTS = 1_599_00;
const FOUNDING_NOMAD_CENTS = 750_00;
const NOMAD_STANDARD_ANNUAL_CENTS = 1_500_00;
const NOMAD_STANDARD_QUARTERLY_CENTS = 500_00;

export function calculateTotalCents(
  forkSelection: string | null | undefined,
  tierSelection: string | null | undefined
): number {
  if (forkSelection === "re_biz_nomads") {
    const tierCents =
      tierSelection === "founding_nomad"
        ? FOUNDING_NOMAD_CENTS
        : tierSelection === "nomad_standard_quarterly"
          ? NOMAD_STANDARD_QUARTERLY_CENTS
          : NOMAD_STANDARD_ANNUAL_CENTS;

    return tierCents + SETUP_FEE_CENTS;
  }

  return MEMBERSHIP_CENTS + SETUP_FEE_CENTS;
}

export function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}
