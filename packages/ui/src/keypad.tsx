import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export interface KeypadProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** A grid that arranges whatever `Key` children it is given. It knows nothing about operations. */
export function Keypad({ className, children, ...rest }: KeypadProps) {
  return (
    <div className={clsx("sc-keypad", className)} {...rest}>
      {children}
    </div>
  );
}
