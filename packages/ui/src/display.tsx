import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type DisplayState = "idle" | "busy" | "error";

/**
 * Longest value, in characters, each fit step still renders one line at a 360px viewport: a
 * 285px readout column (300px minus a scrollbar) at a 0.6em advance. The CSS ladder in
 * `components.css` maps each step to the next smaller type-scale size.
 */
export const FIT_STEP_LIMITS: readonly number[] = [7, 10, 15, 16, 20, 25, 29, 33, 39, 43];

/** The readout's size step: a pure function of the value's length, never runtime measurement. */
export function readoutFitStep(value: string): number {
  const length = value.length;
  let step = 0;
  for (const limit of FIT_STEP_LIMITS) {
    if (length <= limit) return step;
    step += 1;
  }
  return step;
}

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
      <div className="sc-display__value" data-fit={readoutFitStep(value)}>{value}</div>
      {hint && <div className="sc-display__hint">{hint}</div>}
    </div>
  );
}
