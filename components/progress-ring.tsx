"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
  className?: string;
}

const sizes = {
  sm: { diameter: 48, stroke: 4, fontSize: "text-xs" },
  md: { diameter: 96, stroke: 6, fontSize: "text-lg" },
  lg: { diameter: 160, stroke: 8, fontSize: "text-3xl" }
};

export function ProgressRing({
  value,
  size = "md",
  color = "stroke-comet",
  label,
  className = ""
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const config = sizes[size];
  const radius = (config.diameter - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedValue(Math.min(Math.max(value, 0), 100)), 100);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={config.diameter}
        height={config.diameter}
        viewBox={`0 0 ${config.diameter} ${config.diameter}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          className="stroke-white/10 dark:stroke-white/10"
          strokeWidth={config.stroke}
        />
        {/* Foreground progress */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-display font-bold ${config.fontSize}`} aria-label={`${Math.round(animatedValue)} percent`}>
          {Math.round(animatedValue)}%
        </span>
        {label && size !== "sm" && (
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest opacity-60">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
