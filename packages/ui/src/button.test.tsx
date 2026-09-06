import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as barrel from "./index";
import { Button } from "./button";

describe("Button — a real button element", () => {
  it("renders its children in a <button> that does not submit a form by default", () => {
    render(<Button>Go</Button>);

    const button = screen.getByRole("button", { name: "Go" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("lets the caller override the type, e.g. submit", () => {
    render(<Button type="submit">Send</Button>);

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
  });
});

describe("Button — variants and sizes", () => {
  it("defaults to a medium primary", () => {
    render(<Button>Go</Button>);

    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveClass("sc-btn", "sc-btn--primary", "sc-btn--md");
    expect(button).not.toHaveClass("sc-btn--block");
  });

  it("carries the requested variant and size classes", () => {
    render(<Button variant="danger" size="lg">Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("sc-btn--danger", "sc-btn--lg");
  });

  it("spans its container when block is set", () => {
    render(<Button block>Full width</Button>);

    expect(screen.getByRole("button", { name: "Full width" })).toHaveClass("sc-btn--block");
  });
});

describe("Button — composition", () => {
  it("composes a caller's className with sc-btn instead of replacing it", () => {
    render(<Button className="form__save">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("sc-btn", "form__save");
  });

  it("forwards the rest of the DOM props", () => {
    const onClick = vi.fn();
    render(<Button data-testid="save" aria-label="Save the form" disabled onClick={onClick}>Go</Button>);

    const button = screen.getByTestId("save");
    expect(button).toHaveAttribute("aria-label", "Save the form");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("@repo/ui barrel", () => {
  it("exports Button from the package root", () => {
    expect(barrel.Button).toBe(Button);
  });
});

describe("sc-btn styles — the press and the disabled state", () => {
  const section = readFileSync(resolve(__dirname, "styles/components/button.css"), "utf8");
  const base = section.match(/\.sc-btn\s*\{([^}]*)\}/)?.[1] ?? "";
  const press = section.match(/\.sc-btn:active:not\(:disabled\)\s*\{([^}]*)\}/)?.[1] ?? "";
  const disabled = section.match(/\.sc-btn:disabled\s*\{([^}]*)\}/)?.[1] ?? "";

  it("presses the button down-right and drops its shadow", () => {
    expect(press).toMatch(/box-shadow:\s*none/);
    expect(press).toMatch(/transform:\s*translate\(var\(--press-offset\),\s*var\(--press-offset\)\)/);
  });

  it("pins the disabled state: not-allowed cursor, no shadow, no press of its own", () => {
    expect(disabled).toMatch(/cursor:\s*not-allowed/);
    expect(disabled).toMatch(/box-shadow:\s*none/);
    expect(section).toMatch(/\.sc-btn:active:not\(:disabled\)/);
  });

  it("keeps the hard border on every variant", () => {
    expect(base).toMatch(/border:\s*var\(--border-2\)\s*solid\s*var\(--border-strong\)/);
  });
});
