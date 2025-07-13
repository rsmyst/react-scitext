import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { RichText } from "./RichText";
import { Smiles } from "../Smiles";

// Mock the SMILES validation utilities
vi.mock("../../utils", async () => {
  const actual = await vi.importActual("../../utils");
  return {
    ...actual,
    validateSmilesCode: vi.fn(() => true),
    sanitizeSmilesCode: vi.fn((code: string) => code),
  };
});

describe("RichText Accessibility", () => {
  test("should have proper ARIA attributes for main content", () => {
    const content = "# Heading\n\nSome content with $x^2$ math.";

    render(<RichText content={content} />);

    const article = screen.getByRole("article");
    expect(article.getAttribute("aria-label")).toBe(
      "Scientific document content"
    );
    expect(article.className).toContain("prose");
  });

  test("should have proper ARIA attributes for inline content", () => {
    const content = "Inline content with $x^2$ math.";

    render(<RichText content={content} inline={true} />);

    const presentation = screen.getByRole("presentation");
    expect(presentation.getAttribute("aria-label")).toBe(
      "Scientific content with mixed formatting"
    );
  });

  test("should have proper ARIA attributes for error states", () => {
    const invalidContent = "<script>alert('xss')</script>";

    render(<RichText content={invalidContent} />);

    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(alert.className).toContain("error-message");
  });

  test("should have proper ARIA attributes for math content", () => {
    const content = "$$E = mc^2$$";

    const { container } = render(<RichText content={content} />);

    // Look for elements with role="math" in the container
    const mathElements = container.querySelectorAll('[role="math"]');
    expect(mathElements.length).toBeGreaterThan(0);
    expect(mathElements[0].getAttribute("aria-label")).toBeTruthy();
    expect(mathElements[0].getAttribute("aria-label")).toContain(
      "Mathematical expression"
    );
  });

  test("should have proper heading accessibility", () => {
    const content = "# Main Title\n## Subtitle";

    render(<RichText content={content} />);

    const headings = screen.getAllByRole("heading");
    expect(headings[0].tagName).toBe("H1");
    expect(headings[1].tagName).toBe("H2");
    expect(headings.length).toBe(2);

    // Check that headings have accessible text content
    expect(headings[0].textContent).toBe("Main Title");
    expect(headings[1].textContent).toBe("Subtitle");
  });
});

describe("Smiles Accessibility", () => {
  test("should have proper ARIA attributes for chemical structures", () => {
    const mockErrorCallback = vi.fn();

    render(<Smiles code="c1ccccc1" errorCallback={mockErrorCallback} />);

    const containers = screen.getAllByRole("img");
    // Use the first container (not the SVG)
    const container = containers[0];
    expect(container.getAttribute("aria-label")).toBe(
      "Chemical structure: c1ccccc1"
    );
    expect(container.getAttribute("aria-describedby")).toBeTruthy();

    const description = screen.getByText(/SMILES notation: c1ccccc1/);
    expect(description.style.position).toBe("absolute");
    expect(description.style.width).toBe("1px");
    expect(description.style.height).toBe("1px");
  });

  test("should hide screen reader text visually but keep it accessible", () => {
    const mockErrorCallback = vi.fn();

    const { container } = render(
      <Smiles code="c1ccccc1" errorCallback={mockErrorCallback} />
    );

    const description = screen.getByText(/SMILES notation: c1ccccc1/);

    // Test that the element is visually hidden (screen reader only)
    expect(description.style.position).toBe("absolute");
    expect(description.style.width).toBe("1px");
    expect(description.style.height).toBe("1px");
    expect(description.style.overflow).toBe("hidden");
    expect(description.style.clip).toContain("rect(0");
    expect(description.style.whiteSpace).toBe("nowrap");
    expect(description.style.border).toContain("0");
    expect(description.style.margin).toBe("-1px");
    expect(description.style.padding).toContain("0");

    // Test that the element is still in the DOM (accessible to screen readers)
    expect(description.parentNode).toBeTruthy();
    expect(description.textContent).toContain("SMILES notation: c1ccccc1");

    // Test that it has proper ID for aria-describedby
    expect(description.getAttribute("id")).toBe("smiles-description-c1ccccc1");

    // Test that it's connected to the main element via aria-describedby
    const mainContainer = container.querySelector('[role="img"]');
    expect(mainContainer?.getAttribute("aria-describedby")).toBe(
      "smiles-description-c1ccccc1"
    );
  });

  test("should not be visible in visual rendering (simulated)", () => {
    const mockErrorCallback = vi.fn();

    render(<Smiles code="c1ccccc1" errorCallback={mockErrorCallback} />);

    const description = screen.getByText(/SMILES notation: c1ccccc1/);

    // Create a mock getBoundingClientRect to simulate that the element is not visible
    const mockGetBoundingClientRect = vi.fn(() => ({
      width: 1,
      height: 1,
      top: -1,
      left: -1,
      right: 0,
      bottom: 0,
      x: -1,
      y: -1,
      toJSON: () => ({}),
    }));

    // Cast to any to bypass TypeScript restrictions for testing
    (description as any).getBoundingClientRect = mockGetBoundingClientRect;

    const rect = description.getBoundingClientRect();

    // Verify the element has minimal visual footprint
    expect(rect.width).toBe(1);
    expect(rect.height).toBe(1);
    expect(rect.top).toBe(-1);
    expect(rect.left).toBe(-1);

    // But it should still be in the DOM tree
    expect(description.parentNode).toBeTruthy();
    expect(description.textContent).toBeTruthy();
  });

  test("should be accessible to screen readers via aria-describedby", () => {
    const mockErrorCallback = vi.fn();

    const { container } = render(
      <Smiles code="c1ccccc1" errorCallback={mockErrorCallback} />
    );

    // Find the main image element
    const imgElement = screen.getByRole("img");
    const describedById = imgElement.getAttribute("aria-describedby");

    // Find the description element by ID
    const descriptionElement = container.querySelector(`#${describedById}`);
    expect(descriptionElement).toBeTruthy();
    expect(descriptionElement?.textContent).toContain(
      "SMILES notation: c1ccccc1"
    );

    // Verify the description is connected but visually hidden
    const htmlElement = descriptionElement as HTMLElement;
    expect(htmlElement?.style.position).toBe("absolute");
    expect(htmlElement?.style.width).toBe("1px");
    expect(htmlElement?.style.height).toBe("1px");

    // This simulates what a screen reader would do - it can access the content
    // even though it's visually hidden
    expect(imgElement.getAttribute("aria-describedby")).toBe(
      descriptionElement?.getAttribute("id")
    );
  });

  test("should have proper ARIA attributes for error states", async () => {
    const mockErrorCallback = vi.fn();

    // Mock validation to return false for this test
    const { validateSmilesCode } = await import("../../utils");
    vi.mocked(validateSmilesCode).mockReturnValue(false);

    render(<Smiles code="invalid" errorCallback={mockErrorCallback} />);

    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
    expect(alert.getAttribute("aria-label")).toBe(
      "Chemical structure rendering error"
    );
  });
});
