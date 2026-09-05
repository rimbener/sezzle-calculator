import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", block = false, type = "button", className, children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={clsx("sc-btn", `sc-btn--${variant}`, `sc-btn--${size}`, block && "sc-btn--block", className)} {...rest}>
      {children}
    </button>
  );
}
