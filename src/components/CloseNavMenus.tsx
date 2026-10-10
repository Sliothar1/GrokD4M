"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** <details> stays open across client navigations. Close it when the route changes. */
export function CloseNavMenus() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const nav = document.querySelector("nav[aria-label='Main']");
    if (!nav) return;
    for (const menu of nav.querySelectorAll("details[open]")) {
      menu.removeAttribute("open");
    }
  }, [pathname, search]);
  return null;
}
