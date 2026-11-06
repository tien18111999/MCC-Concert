"use client";

import { useState } from "react";
import { solidButtonClass } from "@/lib/styles";

export function CopyHandle({ value }: { value: string }) {
  const [label, setLabel] = useState("Copy");

  return (
    <button
      type="button"
      className={`${solidButtonClass} px-4 py-2`}
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => {
            setLabel("Copied");
            window.setTimeout(() => setLabel("Copy"), 1600);
          },
          () => setLabel(value),
        );
      }}
    >
      {label}
    </button>
  );
}
