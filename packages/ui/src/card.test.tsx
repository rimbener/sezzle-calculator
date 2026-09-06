import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as barrel from "./index";
import { Card } from "./card";

describe("Card — the anatomy", () => {
  it("renders the body in a section, with no head when neither title nor eyebrow is given", () => {
    render(<Card>body copy</Card>);

    const card = screen.getByText("body copy").closest("section");
    expect(card).toHaveClass("sc-card");
    expect(card!.querySelector(".sc-card__head")).toBeNull();
    expect(card!.querySelector(".sc-card__foot")).toBeNull();
  });

  it("puts an eyebrow above an h2 title in a shared header", () => {
    render(<Card eyebrow="Paper" title="Card with head and foot">body</Card>);

    const head = screen.getByText("Card with head and foot").closest(".sc-card__head");
    expect(head).not.toBeNull();
    expect(screen.getByText("Paper")).toHaveClass("sc-card__eyebrow");
    expect(screen.getByText("Card with head and foot").tagName).toBe("H2");
    expect(screen.getByText("Card with head and foot")).toHaveClass("sc-card__title");
  });

  it("renders the title alone when there is no eyebrow", () => {
    render(<Card title="Only a title">body</Card>);

    expect(screen.getByText("Only a title")).toHaveClass("sc-card__title");
  });

  it("renders the footer as a footer element", () => {
    render(<Card title="T" footer={<span>Footer slot</span>}>body</Card>);

    expect(screen.getByText("Footer slot").closest("footer")).toHaveClass("sc-card__foot");
  });

  it("sinks the surface only for the sunken tone", () => {
    const { unmount } = render(<Card tone="sunken">sunk</Card>);
    expect(screen.getByText("sunk").closest(".sc-card")).toHaveClass("sc-card--sunken");
    unmount();

    render(<Card>flat</Card>);
    expect(screen.getByText("flat").closest(".sc-card")).not.toHaveClass("sc-card--sunken");
  });
});

describe("Card — composition", () => {
  it("composes a caller's className with sc-card instead of replacing it", () => {
    render(<Card className="panel">body</Card>);

    expect(screen.getByText("body").closest(".sc-card")).toHaveClass("sc-card", "panel");
  });

  it("forwards the rest of the DOM props", () => {
    render(<Card data-testid="card" id="summary">body</Card>);

    expect(screen.getByTestId("card")).toHaveAttribute("id", "summary");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Card from the package root", () => {
    expect(barrel.Card).toBe(Card);
  });
});
