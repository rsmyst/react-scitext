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
      <div className="smiles-error bg-red-50 border border-red-200 rounded-md p-3 my-2">
        <p className="text-sm text-red-800">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="smiles-container block">
      <div ref={containerRef} style={{ maxWidth: "100%", height: "auto" }} />
    </div>
  );
};
