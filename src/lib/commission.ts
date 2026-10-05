export const PLATFORM_COMMISSION = 0.15;   // 15% company cut
export const DRIVER_SHARE = 1 - PLATFORM_COMMISSION;  // 85%

export function driverPayout(amount: number) {
  return Math.round(amount * DRIVER_SHARE);
}

// Defined as the remainder so fee + payout always equals the amount exactly
// (rounding each side separately can create or lose a naira).
export function platformFee(amount: number) {
  return amount - driverPayout(amount);
}
