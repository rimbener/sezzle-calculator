import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type DisplayState = "idle" | "busy" | "error";

export interface DisplayProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  expression?: ReactNode;
  hint?: ReactNode;
  state?: DisplayState;
  size?: "sm" | "md" | "lg";
}

export function Display({ value = "0", expression, hint, state = "idle", size = "md", className, ...rest }: DisplayProps) {
  return (
    <div role="status" aria-live="polite" className={clsx("sc-display", `sc-display--${size}`, state !== "idle" && `sc-display--${state}`, className)} {...rest}>
      <div aria-hidden="true" className="sc-display__scan" />
      <div className="sc-display__meta">
        <span>{state === "busy" ? "Working" : state === "error" ? "Error" : "Ready"}</span>
        <span>{expression}</span>
      </div>
      <div className="sc-display__value">{value}</div>
      {hint && <div className="sc-display__hint">{hint}</div>}
    </div>
  );
}
