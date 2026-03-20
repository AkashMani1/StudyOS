"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/70 p-5 shadow-glow backdrop-blur-xl dark:bg-slate-950/70",
        className
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variantStyles = {
    primary: "bg-comet text-white hover:bg-comet/90",
    secondary: "bg-aurora text-ink hover:bg-aurora/90",
    ghost: "bg-white/70 text-slate-900 hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
    danger: "bg-ember text-white hover:bg-ember/90"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-comet focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-comet focus:ring-4 focus:ring-comet/10 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-comet focus:ring-4 focus:ring-comet/10 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

export function Badge({
  className,
  children
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-700 dark:bg-white/10 dark:text-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.32em] text-comet">{eyebrow}</p> : null}
      <h2 className="font-display text-2xl font-bold text-ink dark:text-white">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/70", className)} />;
}
