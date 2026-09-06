import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as barrel from "./index";
import { Key } from "./key";

describe("Key — the face and the name", () => {
  it("renders its label in a button of the requested face, number by default", () => {
    render(<Key label="7" />);

    const key = screen.getByRole("button", { name: "7" });
    expect(key).toHaveClass("sc-key", "sc-key--number");
    expect(key).toHaveAttribute("type", "button");
    expect(key).toHaveTextContent("7");
  });

  it("carries a class for each face", () => {
    for (const face of ["number", "operator", "function", "equals", "clear"] as const) {
      const { unmount } = render(<Key face={face} label={face} />);
      expect(screen.getByRole("button", { name: face })).toHaveClass(`sc-key--${face}`);
      unmount();
    }
  });

  it("names glyph keys through ariaLabel", () => {
    render(<Key face="function" label="√" ariaLabel="Square root" />);

    expect(screen.getByRole("button", { name: "Square root" })).toHaveAttribute("aria-label", "Square root");
  });

  it("falls back to a string label for the accessible name", () => {
    render(<Key label="7" />);

    expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-label", "7");
  });

  it("leaves the name to the content when a non-string label has no ariaLabel", () => {
    render(<Key label={<span>×</span>} />);

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-label");
  });
});

describe("Key — the latched look and the sublabel", () => {
  it("latches a selected operator through aria-pressed, and only then", () => {
    const { unmount } = render(<Key label="+" ariaLabel="Add" active />);
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute("aria-pressed", "true");
    unmount();

    render(<Key label="+" ariaLabel="Add" />);
    expect(screen.getByRole("button", { name: "Add" })).not.toHaveAttribute("aria-pressed");
  });

  it("shows the sublabel under the label", () => {
    render(<Key label="√" sublabel="sqrt" ariaLabel="Square root" />);

    expect(screen.getByText("sqrt")).toHaveClass("sc-key__sub");
  });

  it("renders no sublabel element without one", () => {
    render(<Key label="7" />);

    expect(document.querySelector(".sc-key__sub")).toBeNull();
  });
});

describe("Key — the grid and the press", () => {
  it("spans the requested number of grid columns", () => {
    render(<Key label="AC" span={2} />);

    expect(screen.getByRole("button", { name: "AC" }).style.gridColumn).toBe("span 2");
  });

  it("leaves the span to the grid when the key takes one column", () => {
    render(<Key label="7" />);

    expect(screen.getByRole("button", { name: "7" }).style.gridColumn).toBe("");
  });

  it("merges a caller's style with the span", () => {
    render(<Key label="0" span={2} style={{ gridColumnEnd: "span 2" }} />);

    const key = screen.getByRole("button", { name: "0" });
    expect(key.style.gridColumn).toBe("span 2");
    expect(key.style.gridColumnEnd).toBe("span 2");
  });

  it("presses through to onPress, and a disabled key presses nowhere", () => {
    const onPress = vi.fn();
    const { unmount } = render(<Key label="7" onPress={onPress} />);
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    unmount();

    render(<Key label="7" onPress={onPress} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "7" })).toBeDisabled();
  });

  it("composes a caller's className with sc-key instead of replacing it", () => {
    render(<Key label="7" className="pad__seven" />);

    expect(screen.getByRole("button", { name: "7" })).toHaveClass("sc-key", "pad__seven");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Key from the package root", () => {
    expect(barrel.Key).toBe(Key);
  });
});
