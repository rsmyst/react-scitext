import { createRoot } from "react-dom/client";
import { RichText } from "./components/RichText/RichText";
import { Smiles } from "./components/Smiles/Smiles";

// Test core features without needing a test runner
function TestCoreFeatures() {
  const handleError = (error: unknown) => {
    console.error("Component error:", error);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Core Features Test</h1>

      <h2>1. SMILES Rendering</h2>
      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <h3>Simple molecule (Ethanol):</h3>
        <Smiles code="CCO" errorCallback={handleError} />
      </div>

      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <h3>Complex molecule (Benzene):</h3>
        <Smiles code="c1ccccc1" errorCallback={handleError} />
      </div>

      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <h3>Invalid SMILES (should show error):</h3>
        <Smiles code="invalid&smiles" errorCallback={handleError} />
      </div>

      <h2>2. Inline LaTeX</h2>
      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <RichText content="The equation \\(x^2 + y^2 = z^2\\) is the Pythagorean theorem." />
      </div>

      <h2>3. Block LaTeX</h2>
      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <RichText content="The integral formula:$$\\int_0^\\infty e^{-x} dx = 1$$" />
      </div>

      <h2>4. Mixed Content</h2>
      <div
        style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}
      >
        <RichText content="Ethanol <smiles>CCO</smiles> has the molecular formula \\(C_2H_6O\\) and follows the equation $$\\text{Combustion: } C_2H_6O + 3O_2 \\rightarrow 2CO_2 + 3H_2O$$" />
      </div>
    </div>
  );
}

// Simple test runner
function runTest() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  try {
    const root = createRoot(container);
    root.render(<TestCoreFeatures />);
    console.log("✅ Core features test rendered successfully");
    return true;
  } catch (error) {
    console.error("❌ Core features test failed:", error);
    return false;
  }
}

export { TestCoreFeatures, runTest };
