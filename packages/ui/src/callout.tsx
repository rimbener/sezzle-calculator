import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type CalloutTone = "danger" | "warning" | "success" | "info";

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: CalloutTone;
  title?: ReactNode;
  /** Machine error code, e.g. "DIVISION_BY_ZERO". */
  code?: string;
  onDismiss?: () => void;
  children?: ReactNode;
}

export function Callout({ tone = "danger", title, code, onDismiss, className, children, ...rest }: CalloutProps) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={clsx("sc-callout", `sc-callout--${tone}`, className)} {...rest}>
      <div aria-hidden="true" className="sc-callout__bar" />
      <div className="sc-callout__body">
        <div className="sc-callout__head">
          {title && <strong className="sc-callout__title">{title}</strong>}
          {code && <span className="sc-callout__code">{code}</span>}
        </div>
        {children && <div className="sc-callout__text">{children}</div>}
      </div>
      {onDismiss && <button type="button" className="sc-callout__x" onClick={onDismiss} aria-label="Dismiss">&times;</button>}
    </div>
  );
}
