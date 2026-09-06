import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as barrel from "./index";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its children in a span, neutral by default", () => {
    render(<Badge>P0</Badge>);

    const badge = screen.getByText("P0");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("sc-badge", "sc-badge--neutral");
  });

  it("carries a class for each tone", () => {
    for (const tone of ["neutral", "info", "success", "warning", "danger"] as const) {
      const { unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      expect(screen.getByText(tone)).toHaveClass(`sc-badge--${tone}`);
      unmount();
    }
  });
});

describe("Badge — composition", () => {
  it("composes a caller's className with sc-badge instead of replacing it", () => {
    render(<Badge className="masthead__tag">tag</Badge>);

    expect(screen.getByText("tag")).toHaveClass("sc-badge", "masthead__tag");
  });

  it("forwards the rest of the DOM props", () => {
    render(<Badge data-testid="status" title="current state">live</Badge>);

    expect(screen.getByTestId("status")).toHaveAttribute("title", "current state");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Badge from the package root", () => {
    expect(barrel.Badge).toBe(Badge);
  });
});
