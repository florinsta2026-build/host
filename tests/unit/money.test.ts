import { describe, it, expect } from "vitest";
import { majorToMinor, minorToMajor, formatMoney } from "@/lib/utils/money";

describe("money utils", () => {
  it("converts AED major units to minor (fils) correctly", () => {
    expect(majorToMinor(295)).toBe(29500);
    expect(majorToMinor(19.99)).toBe(1999);
    expect(majorToMinor(0.1)).toBe(10); // classic float trap — must not become 9 or 11
  });

  it("converts minor back to major", () => {
    expect(minorToMajor(29500)).toBe(295);
    expect(minorToMajor(1999)).toBe(19.99);
  });

  it("formats whole AED amounts without decimals", () => {
    expect(formatMoney(29500)).toBe("AED 295");
  });

  it("formats fractional AED amounts with two decimals", () => {
    expect(formatMoney(1999)).toBe("AED 19.99");
  });

  it("never produces floating point drift across repeated operations", () => {
    let total = 0;
    for (let i = 0; i < 3; i++) total += majorToMinor(19.99);
    expect(total).toBe(5997); // 3 x 1999, exact — would drift with float math
  });
});
