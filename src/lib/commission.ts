export const PLATFORM_COMMISSION = 0.15;   // 15% company cut
export const DRIVER_SHARE = 1 - PLATFORM_COMMISSION;  // 85%

export function platformFee(amount: number) {
  return Math.round(amount * PLATFORM_COMMISSION);
}

export function driverPayout(amount: number) {
  return Math.round(amount * DRIVER_SHARE);
}
