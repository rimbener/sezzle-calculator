import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as barrel from "./index";
import { BusyLamp } from "./busy-lamp";

describe("BusyLamp", () => {
  it("renders an aria-hidden dot inside a lamp span, idle by default", () => {
    render(<BusyLamp />);

    const lamp = document.querySelector(".sc-lamp");
    expect(lamp).not.toBeNull();
    expect(lamp).toHaveClass("sc-lamp--idle");
    const dot = lamp!.querySelector(".sc-lamp__dot");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it("carries a class for each state", () => {
    for (const state of ["idle", "busy", "up", "down"] as const) {
      const { unmount } = render(<BusyLamp state={state} label={state} />);
      expect(screen.getByText(state).closest(".sc-lamp")).toHaveClass(`sc-lamp--${state}`);
      unmount();
    }
  });

  it("shows its label as lamp text, not as part of the dot", () => {
    render(<BusyLamp state="up" label="Live" />);

    expect(screen.getByText("Live")).toHaveTextContent("Live");
    expect(document.querySelector(".sc-lamp__dot")).not.toHaveTextContent("Live");
  });
});

describe("BusyLamp — composition", () => {
  it("composes a caller's className with sc-lamp instead of replacing it", () => {
    render(<BusyLamp className="masthead__lamp" />);

    expect(document.querySelector(".sc-lamp")).toHaveClass("sc-lamp", "masthead__lamp");
  });

  it("forwards the rest of the DOM props", () => {
    render(<BusyLamp data-testid="lamp" title="service state" />);

    expect(screen.getByTestId("lamp")).toHaveAttribute("title", "service state");
  });
});

describe("sc-lamp styles — the blink", () => {
  const section = readFileSync(resolve(__dirname, "styles/components/busy-lamp.css"), "utf8");
  const busyDot = section.match(/\.sc-lamp--busy \.sc-lamp__dot\s*\{([^}]*)\}/)?.[1] ?? "";
  const idleDot = section.match(/\.sc-lamp__dot\s*\{([^}]*)\}/)?.[1] ?? "";

  it("blinks the busy state with steps(1, end) — never a spinner or a fading pulse", () => {
    expect(busyDot).toMatch(/animation:[^;]*lcd-blink/);
    expect(busyDot).toMatch(/steps\(1,\s*end\)/);
  });

  it("leaves the idle dot unlit and unanimated", () => {
    expect(idleDot).toMatch(/background:\s*var\(--ink-3\)/);
    expect(idleDot).not.toMatch(/animation/);
  });
});

describe("@repo/ui barrel", () => {
  it("exports BusyLamp from the package root", () => {
    expect(barrel.BusyLamp).toBe(BusyLamp);
  });
});
