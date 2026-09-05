import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type LampState = "idle" | "busy" | "up" | "down";

export interface BusyLampProps extends HTMLAttributes<HTMLSpanElement> {
  state?: LampState;
  label?: ReactNode;
}

export function BusyLamp({ state = "idle", label, className, ...rest }: BusyLampProps) {
  return (
    <span className={clsx("sc-lamp", `sc-lamp--${state}`, className)} {...rest}>
      <span aria-hidden="true" className="sc-lamp__dot" />
      {label}
    </span>
  );
}
