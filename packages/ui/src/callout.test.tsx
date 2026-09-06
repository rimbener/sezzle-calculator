import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "./callout";

describe("Callout — the announced roles stay as shipped (AC-10)", () => {
  it("announces a danger callout as an alert", () => {
    render(<Callout tone="danger" title="Error" code="DIVISION_BY_ZERO">cannot divide by zero</Callout>);

    expect(screen.getByRole("alert")).toHaveTextContent("cannot divide by zero");
  });

  it("announces every other tone as a status", () => {
    render(<Callout tone="info">informational</Callout>);

    expect(screen.getByRole("status")).toHaveTextContent("informational");
  });
});
