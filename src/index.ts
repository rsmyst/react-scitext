// Main package exports
export { RichText, Smiles } from "./components";
export type { RichTextProps, SmilesProps } from "./types";

// Utility exports for advanced usage
export {
  // LaTeX utilities
  findTopLevelEnvs,
  splitLatex,
  isInlineLatexFragment,
  isBlockLatexFragment,
  isSelectiveInlineLatex,
  isSimpleVariable,
  isSmallVariableLatex,
  isLatexEnvironment,
  validateLatexInput,
  sanitizeLatexContent,

  // Markdown utilities
  processTextWithSmallVariables,
  renderHeading,
  processMixedContent,
  validateMarkdownContent,
  sanitizeMarkdownContent,

  // SMILES utilities
  splitSmiles,
  isSmilesCode,
  validateSmilesCode,
  sanitizeSmilesCode,
  extractSmilesCode,
} from "./utils";

export type {
  LatexEnv,
  ContentMatch,
  ProcessingOptions,
  MathFragment,
  VariableMatch,
} from "./types";

// Import accessibility styles
import "./styles/accessibility.css";
