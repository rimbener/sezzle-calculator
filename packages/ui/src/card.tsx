import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  tone?: "paper" | "sunken";
  children?: ReactNode;
}

export function Card({ title, eyebrow, footer, tone = "paper", className, children, ...rest }: CardProps) {
  return (
    <section className={clsx("sc-card", tone === "sunken" && "sc-card--sunken", className)} {...rest}>
      {(title || eyebrow) && (
        <header className="sc-card__head">
          {eyebrow && <span className="sc-card__eyebrow">{eyebrow}</span>}
          {title && <h2 className="sc-card__title">{title}</h2>}
        </header>
      )}
      <div className="sc-card__body">{children}</div>
      {footer && <footer className="sc-card__foot">{footer}</footer>}
    </section>
  );
}
