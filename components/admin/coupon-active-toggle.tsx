"use client";

import { useState, useTransition } from "react";
import { toggleCouponActive } from "@/lib/coupons/admin-actions";

export function CouponActiveToggle({ couponId, isActive }: { couponId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-xs">
      <input
        type="checkbox"
        checked={active}
        disabled={pending}
        onChange={(e) => {
          setActive(e.target.checked);
          startTransition(() => toggleCouponActive(couponId, e.target.checked));
        }}
      />
      Active
    </label>
  );
}
