import { clsx } from "clsx";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export type KeyFace = "number" | "operator" | "function" | "equals" | "clear";

export interface KeyProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  face?: KeyFace;
  label: ReactNode;
  sublabel?: ReactNode;
  /** Grid columns to span. */
  span?: number;
  /** Latched look for a selected operator. */
  active?: boolean;
  onPress?: () => void;
  /** Accessible name when the label is a glyph. */
  ariaLabel?: string;
}

export function Key({ face = "number", label, sublabel, span = 1, active = false, onPress, ariaLabel, className, style, ...rest }: KeyProps) {
  const s: CSSProperties = span > 1 ? { gridColumn: `span ${span}`, ...style } : { ...style };
  return (
    <button
      type="button"
      className={clsx("sc-key", `sc-key--${face}`, className)}
      style={s}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      aria-pressed={active || undefined}
      onClick={onPress}
      {...rest}
    >
      <span>{label}</span>
      {sublabel && <span className="sc-key__sub">{sublabel}</span>}
    </button>
  );
}
