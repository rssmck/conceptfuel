"use client";
import { useEffect } from "react";

export default function SwRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // SW registration failed — app still works, just not installable
        });
    }
  }, []);

  return null;
}
