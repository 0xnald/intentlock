"use client";

import { useEffect } from "react";

type ScrollOnLoadProps = {
  targetId?: string;
};

export function ScrollOnLoad({ targetId }: ScrollOnLoadProps) {
  useEffect(() => {
    if (!targetId) {
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [targetId]);

  return null;
}
