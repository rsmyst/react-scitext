import type { LatexEnv, MathFragment, VariableMatch } from "../types";

// Find top-level LaTeX environments
export function findTopLevelEnvs(text: string): LatexEnv[] {
  const envs: LatexEnv[] = [];
  const tagPattern = /\\(begin|end)\{([^}]+)\}/g;
  let tagMatch;
  const tags: { type: string; env: string; index: number; length: number }[] =
    [];

  while ((tagMatch = tagPattern.exec(text)) !== null) {
    tags.push({
      type: tagMatch[1], // 'begin' or 'end'
      env: tagMatch[2],
      index: tagMatch.index,
      length: tagMatch[0].length,
    });
  }

  const stack: (typeof tags)[0][] = [];
  for (const tag of tags) {
    if (tag.type === "begin") {
      stack.push(tag);
    } else if (tag.type === "end" && stack.length > 0) {
      if (stack[stack.length - 1].env === tag.env) {
        const startTag = stack.pop()!;
        if (stack.length === 0) {
          const start = startTag.index;
          const end = tag.index + tag.length;
          envs.push({
            start: start,
            end: end,
            content: text.substring(start, end),
          });
        }
      }
    }
  }
  return envs.sort((a, b) => a.start - b.start);
}

// Split LaTeX content for math expressions
export function splitLatex(latex: string): string[] {
  // Capture \( ... \), $$..$$, $..$ and \[..\].
  // The order is important, since $$...$$ also matches for $...$.
  return latex.split(/(\\\(.+?\\\)|\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\])/gs);
}

// Check for inline LaTeX - only matches \(...\) delimiters for true inline math
// We avoid matching simple $...$ to prevent false positives with variables like F_m
export function isInlineLatexFragment(
  fragment: string
): RegExpMatchArray | null {
  return fragment.match(/^\\\((.+?)\\\)$/s);
}

// Check for small single-variable LaTeX expressions that should be rendered as bold/italic HTML
export function isSmallVariableLatex(fragment: string): VariableMatch | null {
  const match = fragment.match(/^\\\(\s*([a-zA-Z_0-9]{1,3})\s*\\\)$/s);
  if (!match) return null;

  const content = match[1];
  // Only match simple variables (1-3 characters, letters, numbers, underscores)
  // Avoid complex expressions that should remain as LaTeX
  if (
    content.includes("\\") ||
    content.includes("{") ||
    content.includes("}") ||
    content.includes("^") ||
    content.includes("_") ||
    content.includes("frac")
  ) {
    return null;
  }

  return { match, content };
}

// Check for simple variables in $...$ format that should be rendered as bold HTML
export function isSimpleVariable(fragment: string): VariableMatch | null {
  const match = fragment.match(/^\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$$/s);
  if (!match) return null;

  const content = match[1];
  // Only match simple single letters or very short variable names
  // Avoid complex expressions that should remain as LaTeX
  if (
    content.includes("\\") ||
    content.includes("{") ||
    content.includes("}") ||
    content.includes("^") ||
    content.includes("_") ||
    content.includes("frac") ||
    content.includes("+") ||
    content.includes("-") ||
    content.includes("*") ||
    content.includes("/") ||
    content.includes("=") ||
    content.includes("(") ||
    content.includes(")") ||
    content.length > 3
  ) {
    return null;
  }

  return { match, content };
}

// Check for block LaTeX - matches \[...\] and $$...$$ for display math
export function isBlockLatexFragment(
  fragment: string
): RegExpMatchArray | null {
  return (
    fragment.match(/^\\\[(.+?)\\\]$/s) || fragment.match(/^\$\$(.*?)\$\$$/s)
  );
}

// Check for single $ inline math - more selective to avoid false positives
// Only matches if it contains mathematical operators, functions, or complex expressions
export function isSelectiveInlineLatex(
  fragment: string
): RegExpMatchArray | null {
  const match = fragment.match(/^\$(.+?)\$$/s);
  if (!match) return null;

  const content = match[1];
  // Only treat as LaTeX if it contains mathematical elements:
  // - Mathematical operators: +, -, *, /, =, <, >, ≤, ≥, etc.
  // - Functions: sin, cos, tan, log, ln, sqrt, etc.
  // - Complex expressions: fractions (\frac), roots (\sqrt), integrals (\int)
  // - Parentheses with operators or functions
  // - Subscripts/superscripts: _ or ^
  // - Chemical formulas with subscripts/superscripts
  // - Sets and coordinate pairs: {(a,b), (c,d), ...} or {a, b, c}
  // - Mathematical symbols and Greek letters
  // - Union/intersection operations
  const mathPatterns = [
    /[+\-*/=<>≤≥≠±∞∑∏∫∪∩∈∉⊆⊇∅∀∃∴∝]/, // Mathematical operators and symbols
    /\\(frac|sqrt|int|sum|prod|lim|sin|cos|tan|log|ln|exp|times|cup|cap|subset|supset|in|notin|forall|exists|therefore|propto)/, // LaTeX functions
    /\([^)]*[+\-*/=,][^)]*\)/, // Expressions in parentheses with operators or commas
    /\{[^}]*[,=][^}]*\}/, // Sets with commas or equals (like {a,b} or {x=1})
    /\{[^}]*\([^)]*,[^)]*\)[^}]*\}/, // Sets containing coordinate pairs like {(a,c), (b,d)}
    /[_^]/, // Subscripts or superscripts
    /[A-Z][a-z]?_?\d+/, // Chemical formulas like C_6H_6, H2O, etc.
    /\\[a-zA-Z]+/, // LaTeX commands like \alpha, \beta, etc.
    /\d+\s*[a-zA-Z]/, // Numbers with variables like 2x, 3y
    /[a-zA-Z]\s*[=]\s*[^,}]/, // Variable assignments like f=, x=
  ];

  return mathPatterns.some((pattern) => pattern.test(content)) ? match : null;
}

// Check if fragment is a LaTeX environment
export function isLatexEnvironment(fragment: string): RegExpMatchArray | null {
  return fragment.match(/^\\begin\{([^}]+)\}(.*?)\\end\{\1\}$/s);
}

// Analyze math fragment to determine its type
export function analyzeMathFragment(fragment: string): MathFragment {
  const isBlock = !!isBlockLatexFragment(fragment);
  const isInline = !!isInlineLatexFragment(fragment);
  const isSelectiveInline = !!isSelectiveInlineLatex(fragment);

  return {
    content: fragment,
    isBlock,
    isInline,
    isSelectiveInline,
  };
}

// Validate LaTeX input for security
export function validateLatexInput(input: string): boolean {
  // Basic validation to prevent potential XSS or malicious LaTeX
  const dangerousPatterns = [
    /\\input\{/,
    /\\include\{/,
    /\\write/,
    /\\read/,
    /\\openin/,
    /\\openout/,
    /\\immediate/,
    /\\special/,
    /\\pdfliteral/,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
}

// Sanitize LaTeX content
export function sanitizeLatexContent(content: string): string {
  // Remove potentially dangerous commands
  return content
    .replace(/\\input\{[^}]*\}/g, "")
    .replace(/\\include\{[^}]*\}/g, "")
    .replace(/\\write[^{]*\{[^}]*\}/g, "")
    .replace(/\\read[^{]*\{[^}]*\}/g, "");
}
