"use client";
import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("cf_theme");
    if (saved && saved !== "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);
  return null;
}
