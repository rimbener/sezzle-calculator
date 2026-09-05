import { clsx } from "clsx";
import type { KeyboardEvent, ReactNode } from "react";

export interface ToggleProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked = false, onChange, label, disabled = false, className }: ToggleProps) {
  const fire = () => { if (!disabled) onChange?.(!checked); };
  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); fire(); }
  };
  return (
    <label className={clsx("sc-toggle", disabled && "sc-toggle--disabled", className)}>
      <span
        className="sc-toggle__track"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={fire}
        onKeyDown={onKeyDown}
      >
        <span aria-hidden="true" className="sc-toggle__knob" />
      </span>
      {label && <span className="sc-toggle__label">{label}</span>}
    </label>
  );
}
