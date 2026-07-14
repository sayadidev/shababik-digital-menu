"use client";

import { useState, useEffect } from "react";

type Props = {
  progress: number;
  logoUrl?: string;
  dismissed: boolean;
};

export default function SplashScreen({ progress, logoUrl, dismissed }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (dismissed) {
      const id = setTimeout(() => setHidden(true), 400);
      return () => clearTimeout(id);
    }
  }, [dismissed]);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
      style={{
        backgroundColor: "#f5efdf",
        opacity: dismissed ? 0 : 1,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <img
            src={logoUrl || "/shababik-solid-logo.png"}
            alt="Shababik"
            fetchPriority="high"
            className="h-auto"
            style={{
              width: "clamp(8rem, 28vw, 12rem)",
              animation: "splash-pulse 2s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes splash-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.85; transform: scale(0.97); }
            }
          `}</style>
        </div>

        <div className="w-48 sm:w-56">
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: "#dcc8b4" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: "#B8743A",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
