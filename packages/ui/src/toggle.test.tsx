import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as barrel from "./index";
import { Toggle } from "./toggle";

const getTrack = () => screen.getByRole("switch");

describe("Toggle — the switch contract", () => {
  it("renders the track as a switch, unchecked by default", () => {
    render(<Toggle />);

    expect(getTrack()).toHaveAttribute("aria-checked", "false");
  });

  it("reflects a controlled checked state", () => {
    render(<Toggle checked />);

    expect(getTrack()).toHaveAttribute("aria-checked", "true");
  });

  it("is focusable while enabled", () => {
    render(<Toggle />);

    expect(getTrack()).toHaveAttribute("tabindex", "0");
    expect(getTrack()).not.toHaveAttribute("aria-disabled");
  });
});

describe("Toggle — interactions", () => {
  it("clicks the track to ask for the next value", () => {
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} />);

    fireEvent.click(getTrack());

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("keeps firing from an uncontrolled default", () => {
    const onChange = vi.fn();
    render(<Toggle onChange={onChange} />);

    fireEvent.click(getTrack());

    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("toggles with Space and Enter, swallowing the key so the page does not scroll or submit", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    expect(fireEvent.keyDown(getTrack(), { key: " " })).toBe(false);
    expect(fireEvent.keyDown(getTrack(), { key: "Enter" })).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it("ignores every other key", () => {
    const onChange = vi.fn();
    render(<Toggle onChange={onChange} />);

    expect(fireEvent.keyDown(getTrack(), { key: "a" })).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("works without an onChange at all", () => {
    render(<Toggle />);

    expect(() => fireEvent.click(getTrack())).not.toThrow();
  });
});

describe("Toggle — disabled", () => {
  it("fires nothing on click or key, drops the switch from tab order, and marks itself aria-disabled", () => {
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} disabled />);

    const track = getTrack();
    fireEvent.click(track);
    fireEvent.keyDown(track, { key: " " });
    fireEvent.keyDown(track, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();

    expect(track).toHaveAttribute("aria-disabled", "true");
    expect(track).toHaveAttribute("tabindex", "-1");
    expect(track.closest("label")).toHaveClass("sc-toggle--disabled");
  });
});

describe("Toggle — composition", () => {
  it("shows the label text beside the track", () => {
    render(<Toggle label="Sound" />);

    expect(getTrack().closest("label")).toHaveTextContent("Sound");
    expect(screen.getByText("Sound")).toHaveClass("sc-toggle__label");
  });

  it("renders no label element without one", () => {
    render(<Toggle />);

    expect(document.querySelector(".sc-toggle__label")).toBeNull();
  });

  it("composes a caller's className with sc-toggle instead of replacing it", () => {
    render(<Toggle className="settings__toggle" />);

    const root = getTrack().closest("label");
    expect(root).toHaveClass("sc-toggle");
    expect(root).toHaveClass("settings__toggle");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Toggle from the package root", () => {
    expect(barrel.Toggle).toBe(Toggle);
  });
});
