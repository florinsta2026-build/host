/**
 * All prices are stored as integer minor units (fils) — 1 AED = 100 fils.
 * Never do float math on money. Always convert at the display boundary only.
 */
export const CURRENCY = "AED";

export function minorToMajor(minor: number): number {
  return minor / 100;
}

export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

export function formatMoney(minor: number, currency: string = CURRENCY): string {
  const major = minorToMajor(minor);
  return `${currency} ${major.toLocaleString("en-AE", {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
