import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as barrel from "./index";
import { Input } from "./input";

describe("Input — the label wiring", () => {
  it("associates the label with the field, so the input is reachable by its label", () => {
    render(<Input label="Operand" />);

    expect(screen.getByLabelText("Operand")).toBe(screen.getByRole("textbox"));
  });

  it("honors an explicit id instead of generating one", () => {
    render(<Input id="gateway-port" label="Port" />);

    expect(screen.getByLabelText("Port")).toHaveAttribute("id", "gateway-port");
  });

  it("renders no label element without one", () => {
    render(<Input placeholder="No label" />);

    expect(document.querySelector(".sc-field__label")).toBeNull();
  });
});

describe("Input — the hint", () => {
  it("describes the field with the hint through aria-describedby", () => {
    render(<Input id="x" label="Operand" hint="Decimals allowed" />);

    const input = screen.getByLabelText("Operand");
    expect(input).toHaveAttribute("aria-describedby", "x-hint");
    expect(screen.getByText("Decimals allowed")).toHaveAttribute("id", "x-hint");
  });

  it("omits aria-describedby when there is no hint", () => {
    render(<Input label="Operand" />);

    expect(screen.getByLabelText("Operand")).not.toHaveAttribute("aria-describedby");
  });
});

describe("Input — validity and the unit slot", () => {
  it("marks the field invalid for screen readers and paints the wrapper", () => {
    render(<Input label="Operand" invalid hint="Enter a finite number" />);

    const input = screen.getByLabelText("Operand");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.closest(".sc-field")).toHaveClass("sc-field--invalid");
  });

  it("leaves validity marks off a healthy field", () => {
    render(<Input label="Operand" />);

    const input = screen.getByLabelText("Operand");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest(".sc-field")).not.toHaveClass("sc-field--invalid");
  });

  it("sits the static suffix unit beside the input inside the well", () => {
    render(<Input label="Timeout" suffix="ms" />);

    const well = screen.getByLabelText("Timeout").closest(".sc-field__well");
    expect(well!.querySelector(".sc-field__suffix")).toHaveTextContent("ms");
  });
});

describe("Input — composition", () => {
  it("forwards the rest of the DOM props to the input element", () => {
    const onChange = vi.fn();
    render(<Input label="Port" placeholder="0" inputMode="numeric" onChange={onChange} />);

    const input = screen.getByLabelText("Port");
    expect(input).toHaveAttribute("placeholder", "0");
    expect(input).toHaveAttribute("inputmode", "numeric");

    fireEvent.change(input, { target: { value: "3000" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("renders a disabled field that stays out of the conversation", () => {
    render(<Input label="Disabled" defaultValue="0" disabled readOnly />);

    const input = screen.getByLabelText("Disabled");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
  });

  it("composes a caller's wrapperClassName with sc-field instead of replacing it", () => {
    render(<Input wrapperClassName="settings__field" />);

    expect(document.querySelector(".sc-field")).toHaveClass("sc-field", "settings__field");
  });
});

describe("@repo/ui barrel", () => {
  it("exports Input from the package root", () => {
    expect(barrel.Input).toBe(Input);
  });
});
