import { useEffect, useRef, useState } from "react";
import * as SmilesDrawer from "smiles-drawer";
import type { SmilesProps } from "../../types";
import { validateSmilesCode, sanitizeSmilesCode } from "../../utils";

export const Smiles = ({ code, errorCallback }: SmilesProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!code || !containerRef.current) {
      return;
    }

    // Validate and sanitize the SMILES code
    const sanitizedCode = sanitizeSmilesCode(code);
    if (!validateSmilesCode(sanitizedCode)) {
      const error = new Error(`Invalid SMILES code: ${code}`);
      setHasError(true);
      setErrorMessage(`Error rendering chemical structure: ${code}`);
      errorCallback(error);
      return;
    }

    setHasError(false);
    setErrorMessage("");

    try {
      const drawer = new SmilesDrawer.SvgDrawer({
        width: 300,
        height: 200,
      });

      SmilesDrawer.parse(
        sanitizedCode,
        (tree: unknown) => {
          if (containerRef.current) {
            // Clear previous content
            containerRef.current.innerHTML = "";

            // Create a new SVG element
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svg.setAttribute("width", "300");
            svg.setAttribute("height", "200");
            svg.setAttribute("data-smiles", code); // Add data-smiles attribute for tests
            svg.style.maxWidth = "100%";
            svg.style.height = "auto";

            // Append SVG to container
            containerRef.current.appendChild(svg);

            // Draw into the SVG
            drawer.draw(tree, svg, "light");
          }
        },
        (parseError: unknown) => {
          setHasError(true);
          setErrorMessage(`Error rendering chemical structure: ${code}`);
          if (errorCallback) {
            errorCallback(parseError);
          }
        }
      );
    } catch (error) {
      setHasError(true);
      setErrorMessage(`Error rendering chemical structure: ${code}`);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  }, [code, errorCallback]);

  if (hasError) {
    return (
      <div
        className="smiles-error bg-red-50 border border-red-200 rounded-md p-3 my-2"
        role="alert"
        aria-live="polite"
        aria-label="Chemical structure rendering error"
      >
        <p className="text-sm text-red-800">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="smiles-container block"
      role="img"
      aria-label={`Chemical structure: ${code}`}
      aria-describedby={`smiles-description-${code.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}`}
    >
      <div ref={containerRef} style={{ maxWidth: "100%", height: "auto" }} />
      <span
        id={`smiles-description-${code.replace(/[^a-zA-Z0-9]/g, "")}`}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        SMILES notation: {code}. This represents a chemical structure rendered
        as a 2D diagram.
      </span>
    </div>
  );
};
