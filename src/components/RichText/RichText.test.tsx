import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { RichText } from "./RichText";

// Mock the SMILES component to verify it's called correctly
vi.mock("../Smiles", () => ({
  Smiles: vi.fn(({ code }) => (
    <div data-testid="smiles-component" data-smiles={code}>
      SMILES: {code}
    </div>
  )),
}));

describe("RichText with SMILES", () => {
  test("should render SMILES content", () => {
    const content = "Benzene structure: <smiles>c1ccccc1</smiles>";

    render(<RichText content={content} />);

    const smilesElement = screen.getByTestId("smiles-component");
    expect(smilesElement).toBeTruthy();
    expect(smilesElement.getAttribute("data-smiles")).toBe("c1ccccc1");
  });

  test("should render multiple SMILES in content", () => {
    const content = `
      Benzene: <smiles>c1ccccc1</smiles>
      Ethanol: <smiles>CCO</smiles>
    `;

    render(<RichText content={content} />);

    const smilesElements = screen.getAllByTestId("smiles-component");
    expect(smilesElements).toHaveLength(2);
    expect(smilesElements[0].getAttribute("data-smiles")).toBe("c1ccccc1");
    expect(smilesElements[1].getAttribute("data-smiles")).toBe("CCO");
  });

  test("should handle SMILES with math content", () => {
    const content = `
      Benzene ($C_6H_6$): <smiles>c1ccccc1</smiles>
      
      Energy: $$E = -36 \\text{ kcal/mol}$$
    `;

    render(<RichText content={content} />);

    const smilesElement = screen.getByTestId("smiles-component");
    expect(smilesElement).toBeTruthy();
    expect(smilesElement.getAttribute("data-smiles")).toBe("c1ccccc1");
  });
});
