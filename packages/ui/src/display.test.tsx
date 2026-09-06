import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Display, FIT_STEP_LIMITS, readoutFitStep } from "./display";

describe("readoutFitStep — the size step derives only from the character count (AC-4)", () => {
  it("maps equal-length values to the same step, whatever the characters are", () => {
    expect(readoutFitStep("123456789012345")).toBe(readoutFitStep("x y=+z!-.:abcde"));
  });

  it("never sends a longer value to a smaller step index (a larger index is a smaller readout size)", () => {
    for (let length = 0; length < 100; length++) {
      expect(readoutFitStep("7".repeat(length + 1))).toBeGreaterThanOrEqual(readoutFitStep("7".repeat(length)));
    }
  });
});

describe("Display — the readout carries its fit step (AC-3, AC-4)", () => {
  const fit = (value: string) =>
    render(<Display value={value} />).container.querySelector(".sc-display__value")?.getAttribute("data-fit") ?? "";

  it("sizes a long entered operand down from the base size", () => {
    expect(fit("123456789012345")).toBe("2");
  });

  it("keeps a short result at the base size", () => {
    expect(fit("1e+21")).toBe("0");
  });

  it("sends equal-length values to one step and longer values never upward", () => {
    expect(fit("1234567890")).toBe(fit("abcdefghij"));
    expect(fit("12345678901")).not.toBe("");
    expect(Number(fit("12345678901"))).toBeGreaterThanOrEqual(Number(fit("1234567890")));
  });

  it("puts the longest error message on the ladder's last step", () => {
    expect(fit("Calculations are temporarily unavailable — try again.")).toBe("10");
  });
});

describe("Display — the readout contract stays as phases 3–4 shipped it (AC-10)", () => {
  it("keeps role=status with aria-live, the aria-hidden scan layer, and the value as plain text", () => {
    render(<Display value="42" expression="6 × 7" hint="hinted" />);

    const display = screen.getByRole("status");
    expect(display).toHaveAttribute("aria-live", "polite");
    expect(display.querySelector(".sc-display__scan")).toHaveAttribute("aria-hidden", "true");
    expect(display.querySelector(".sc-display__value")).toHaveTextContent("42");
  });
});

describe("sc-display styles — the fit ladder (AC-3, AC-4)", () => {
  const css = readFileSync(resolve(__dirname, "styles/components.css"), "utf8");
  const typography = readFileSync(resolve(__dirname, "styles/tokens/typography.css"), "utf8");
  const section = css.split("/* ---- Display ---- */")[1]?.split("/* ---- ")[0] ?? "";
  const rules = (section.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]+\{[^}]*\}/g) ?? []).map(block => {
    const [selector = "", body = ""] = block.replace("}", "").split("{");
    return { selector: selector.trim(), body: body.trim() };
  });
  const tokenPx = new Map([...typography.matchAll(/--([\w-]+):\s*([\d.]+)px/g)].map(([, name, px]) => [name, Number(px)]));
  const sizeOf = (body: string) => {
    const token = body.match(/font-size:\s*var\(--([\w-]+)\)/)?.[1];
    return token === undefined ? undefined : tokenPx.get(token);
  };
  const generic = (step: number) => rules.find(rule => rule.selector === `.sc-display__value[data-fit="${step}"]`);
  const smClamp = (step: number) =>
    rules.find(rule => rule.selector.includes(`.sc-display--sm .sc-display__value[data-fit="${step}"]`));
  const baseOf = (selector: string) => sizeOf(rules.find(rule => rule.selector === selector)?.body ?? "");
  /** Longest value the ladder still renders one-line at a step: the tail step's coverage is 59 (285 / (0.6 × 8)). */
  const maxChars = (step: number) => (step < FIT_STEP_LIMITS.length ? FIT_STEP_LIMITS[step] ?? 0 : 59);

  it("maps every step to a type-scale size, non-increasing for each display size", () => {
    const lgBase = baseOf(".sc-display--lg .sc-display__value");
    const mdBase = baseOf(".sc-display__value");
    const smBase = baseOf(".sc-display--sm .sc-display__value");
    expect(lgBase, "lg base size resolves").toBeDefined();
    expect(mdBase, "md base size resolves").toBeDefined();
    expect(smBase, "sm base size resolves").toBeDefined();
    const lgLadder: number[] = [lgBase!];
    const mdLadder: number[] = [mdBase!];
    const smLadder: number[] = [smBase!];
    for (let step = 1; step <= FIT_STEP_LIMITS.length; step++) {
      const size = sizeOf(generic(step)?.body ?? "");
      expect(size, `step ${step} has a font-size rule`).toBeDefined();
      lgLadder.push(size!);
      mdLadder.push(size!);
      smLadder.push(smClamp(step) ? smLadder[0]! : size!);
    }
    const nonIncreasing = (sizes: number[]) => sizes.every((size, i) => i === 0 || size <= sizes[i - 1]!);
    expect(nonIncreasing(lgLadder), `lg ladder never grows: ${lgLadder.join(", ")}`).toBe(true);
    expect(nonIncreasing(mdLadder), `md ladder never grows: ${mdLadder.join(", ")}`).toBe(true);
    expect(nonIncreasing(smLadder), `sm ladder never grows: ${smLadder.join(", ")}`).toBe(true);
  });

  it("fits each step's longest value into a 285px readout column at a 0.6em advance (360px viewport: 300px minus a scrollbar)", () => {
    for (let step = 0; step <= FIT_STEP_LIMITS.length; step++) {
      const rule = step === 0 ? rules.find(rule => rule.selector === ".sc-display--lg .sc-display__value") : generic(step);
      const size = sizeOf(rule?.body ?? "")!;
      expect(size * 0.6 * maxChars(step), `step ${step} (${size}px × 0.6 × ${maxChars(step)} chars)`).toBeLessThanOrEqual(285);
    }
  });

  it("never truncates: no ellipsis on the value, and past the ladder's coverage the tail wraps instead of clipping", () => {
    expect(section).not.toMatch(/text-overflow/);
    expect(section).not.toMatch(/ellipsis/);
    const tail = generic(FIT_STEP_LIMITS.length)?.body ?? "";
    expect(tail).toMatch(/white-space:\s*normal/);
    expect(tail).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it("stays on the design system: the ladder's tokens exist and the section carries no raw hex or pixel size", () => {
    expect(typography).toMatch(/--text-readout-2xs:\s*8px/);
    expect(section).not.toBe("");
    expect(section).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(section).not.toMatch(/\d+px/);
  });
});
