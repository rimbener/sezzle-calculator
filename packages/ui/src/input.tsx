import { clsx } from "clsx";
import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  invalid?: boolean;
  /** Static unit in a bordered slot, e.g. "ms". */
  suffix?: ReactNode;
  wrapperClassName?: string;
}

export function Input({ id, label, hint, invalid = false, suffix, wrapperClassName, ...rest }: InputProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className={clsx("sc-field", invalid && "sc-field--invalid", wrapperClassName)}>
      {label && <label className="sc-field__label" htmlFor={inputId}>{label}</label>}
      <div className="sc-field__well">
        <input id={inputId} className="sc-field__input" aria-invalid={invalid || undefined} aria-describedby={hintId} {...rest} />
        {suffix && <span className="sc-field__suffix">{suffix}</span>}
      </div>
      {hint && <span id={hintId} className="sc-field__hint">{hint}</span>}
    </div>
  );
}
