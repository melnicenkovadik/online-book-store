"use client";

import { useEffect } from "react";

export function ScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = "manual";
    } catch {}
    return () => {
      try {
        window.history.scrollRestoration = prev;
      } catch {}
    };
  }, []);
  return null;
}
