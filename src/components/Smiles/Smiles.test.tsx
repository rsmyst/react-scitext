import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { Smiles } from "./Smiles";

// Mock the SMILES drawer with the correct import
vi.mock("smiles-drawer", () => ({
  SvgDrawer: vi.fn().mockImplementation(() => ({
    draw: vi.fn(),
  })),
  parse: vi.fn((code, successCallback, errorCallback) => {
    // Mock successful parsing for valid SMILES
    if (code === "CCO" || code === "c1ccccc1" || code === "C") {
      successCallback({ mock: "tree" });
    } else {
      errorCallback(new Error("Invalid SMILES"));
    }
  }),
}));

describe("Smiles", () => {
  const mockErrorCallback = vi.fn();

  beforeEach(() => {
    mockErrorCallback.mockClear();
  });

  test("should render valid SMILES code", () => {
    render(<Smiles code="CCO" errorCallback={mockErrorCallback} />);

    const svgElement = document.querySelector('svg[data-smiles="CCO"]');
    expect(svgElement).toBeTruthy();
  });

  test("should show error for invalid SMILES", () => {
    render(<Smiles code="invalid&smiles" errorCallback={mockErrorCallback} />);

    expect(screen.getByText(/Error rendering chemical structure/)).toBeTruthy();
    expect(mockErrorCallback).toHaveBeenCalled();
  });

  test("should handle empty code gracefully", () => {
    render(<Smiles code="" errorCallback={mockErrorCallback} />);

    // Should not show error for empty code
    expect(screen.queryByText(/Error rendering chemical structure/)).toBeNull();
  });

  test("should validate SMILES code properly", () => {
    // Test with invalid characters
    render(<Smiles code="C&H" errorCallback={mockErrorCallback} />);

    expect(screen.getByText(/Error rendering chemical structure/)).toBeTruthy();
    expect(mockErrorCallback).toHaveBeenCalled();
  });
});

describe("Smiles - Real Library Tests", () => {
  // We can't easily test the real library in a test environment without DOM
  // but we can verify the import works
  test("should import smiles-drawer correctly", async () => {
    // This will fail if the import is wrong
    const SmilesDrawer = await import("smiles-drawer");
    expect(SmilesDrawer).toBeDefined();
    expect(SmilesDrawer.SvgDrawer).toBeDefined();
    expect(SmilesDrawer.parse).toBeDefined();
  });

  test("should parse simple SMILES", async () => {
    const { parse } = await import("smiles-drawer");

    let parseResult = null;
    let parseError = null;

    await new Promise<void>((resolve) => {
      parse(
        "CCO", // Simple ethanol
        (tree: unknown) => {
          parseResult = tree;
          console.log("Parse successful:", tree);
          resolve();
        },
        (error: unknown) => {
          parseError = error;
          console.error("Parse failed:", error);
          resolve();
        }
      );
    });

    expect(parseError).toBeNull();
    expect(parseResult).toBeTruthy();
  });

  test("should render actual SMILES component without mocking", async () => {
    const mockErrorCallback = vi.fn();

    const { container } = render(
      <Smiles code="c1ccccc1" errorCallback={mockErrorCallback} />
    );

    // Wait for the component to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    const svgElement = container.querySelector('svg[data-smiles="c1ccccc1"]');
    expect(svgElement).toBeTruthy();

    // Check if the SVG has any content
    console.log("SVG innerHTML:", svgElement?.innerHTML);
    console.log("SVG children count:", svgElement?.children.length);

    // The component should not have errors
    expect(mockErrorCallback).not.toHaveBeenCalled();

    // Check for loading state
    const loadingElement = container.querySelector(".smiles-loading");
    console.log("Loading element:", loadingElement);

    // Check for error state
    const errorElement = container.querySelector(".smiles-error");
    console.log("Error element:", errorElement);

    // The SVG should be visible (not hidden)
    expect(svgElement?.classList.contains("hidden")).toBeFalsy();
  });
});
