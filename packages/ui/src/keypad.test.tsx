import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesignSystemGallery } from "./design-system-gallery";
import * as barrel from "./index";
import { Key } from "./key";
import { Keypad } from "./keypad";

describe("Keypad", () => {
  it("renders its Key children inside a pad carrying the sc-keypad class", () => {
    render(
      <Keypad data-testid="pad">
        <Key label="7" />
        <Key label="8" />
        <Key face="operator" label="+" ariaLabel="Add" />
      </Keypad>,
    );

    const pad = screen.getByTestId("pad");
    expect(pad).toHaveClass("sc-keypad");
    for (const name of ["7", "8", "Add"]) {
      expect(pad).toContainElement(screen.getByRole("button", { name }));
    }
  });
});

describe("Keypad className", () => {
  it("composes a caller's className with sc-keypad instead of replacing it", () => {
    render(<Keypad data-testid="pad" className="calculator__pad" />);

    const pad = screen.getByTestId("pad");
    expect(pad).toHaveClass("sc-keypad");
    expect(pad).toHaveClass("calculator__pad");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Keypad from the package root", () => {
    expect(barrel.Keypad).toBe(Keypad);
  });
});

describe("sc-keypad styles", () => {
  const section = readFileSync(resolve(__dirname, "styles/components/keypad.css"), "utf8");
  const pad = section.match(/\.sc-keypad\s*\{([^}]*)\}/)?.[1] ?? "";

  it("lays the pad out as a grid with the standard hard border and offset panel shadow", () => {
    expect(pad).toMatch(/display:\s*grid/);
    expect(pad).toMatch(/border:\s*var\(--border-2\) solid var\(--border-strong\)/);
    expect(pad).toMatch(/box-shadow:\s*var\(--shadow-panel\)/);
  });

  it("uses only design-system custom properties: no raw hex value, no raw pixel size", () => {
    expect(section).not.toBe("");
    expect(section).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(section).not.toMatch(/\d+px/);
  });
});

describe("design-system gallery", () => {
  it("shows a Keypad section built from the component", () => {
    render(<DesignSystemGallery />);

    const heading = screen.getByRole("heading", { name: "Keypad" });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const pad = section!.querySelector(".sc-keypad");
    expect(pad).not.toBeNull();
    expect(pad!.querySelectorAll("button.sc-key").length).toBeGreaterThan(0);
  });
});

describe("Keypad purity", () => {
  it("imports nothing from @repo/contracts — the design system stays a vocabulary", () => {
    const source = readFileSync(resolve(__dirname, "keypad.tsx"), "utf8");
    expect(source).not.toMatch(/@repo\/contracts/);
  });
});

describe("keys meet the 44px touch floor at any width, 360px included (AC-2)", () => {
  const sectionAfter = (file: string) => readFileSync(resolve(__dirname, `styles/components/${file}.css`), "utf8");
  const key = sectionAfter("key").match(/\.sc-key\s*\{([^}]*)\}/)?.[1] ?? "";
  const pad = sectionAfter("keypad").match(/\.sc-keypad\s*\{([^}]*)\}/)?.[1] ?? "";
  const spacing = readFileSync(resolve(__dirname, "styles/tokens/spacing.css"), "utf8");
  const token = (name: string) => Number(spacing.match(new RegExp(`--${name}:\\s*([\\d.]+)px`))?.[1]);

  it("sizes the key itself no smaller than --tap-min in both dimensions", () => {
    expect(key).toMatch(/min-height:\s*var\(--key-size\)/);
    expect(key).toMatch(/min-width:\s*var\(--tap-min\)/);
    expect(token("key-size")).toBeGreaterThanOrEqual(token("tap-min"));
  });

  it("never lets a grid column drop below --key-size-sm, which clears the floor too", () => {
    expect(pad).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--key-size-sm\), 1fr\)\)/);
    expect(token("key-size-sm")).toBeGreaterThanOrEqual(token("tap-min"));
  });
});
