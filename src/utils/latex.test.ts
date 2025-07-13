import { describe, test, expect } from "vitest";
import fc from "fast-check";
import {
  findTopLevelEnvs,
  splitLatex,
  isInlineLatexFragment,
  isSmallVariableLatex,
  isSimpleVariable,
  isBlockLatexFragment,
  isSelectiveInlineLatex,
  isLatexEnvironment,
  validateLatexInput,
  sanitizeLatexContent,
} from "./latex";

describe("latex utilities", () => {
  describe("findTopLevelEnvs", () => {
    test("finds simple environment", () => {
      const text = "\\begin{itemize}\\item one\\end{itemize}";
      const envs = findTopLevelEnvs(text);
      expect(envs).toHaveLength(1);
      expect(envs[0]).toEqual({
        start: 0,
        end: text.length,
        content: text,
      });
    });

    test("finds nested environments correctly", () => {
      const text =
        "\\begin{itemize}\\item \\begin{enumerate}\\item nested\\end{enumerate}\\end{itemize}";
      const envs = findTopLevelEnvs(text);
      expect(envs).toHaveLength(1);
      expect(envs[0].content).toBe(text);
    });

    test("finds multiple top-level environments", () => {
      const text =
        "\\begin{itemize}\\item one\\end{itemize} text \\begin{enumerate}\\item two\\end{enumerate}";
      const envs = findTopLevelEnvs(text);
      expect(envs).toHaveLength(2);
      expect(envs[0].content).toBe("\\begin{itemize}\\item one\\end{itemize}");
      expect(envs[1].content).toBe(
        "\\begin{enumerate}\\item two\\end{enumerate}"
      );
    });

    test("handles empty input", () => {
      expect(findTopLevelEnvs("")).toEqual([]);
    });

    test("handles malformed environments", () => {
      const text = "\\begin{itemize}\\item one\\end{enumerate}";
      const envs = findTopLevelEnvs(text);
      expect(envs).toEqual([]);
    });
  });

  describe("splitLatex", () => {
    test("splits latex expressions correctly", () => {
      const latex = "text $x^2$ more $$y^2$$ text";
      const parts = splitLatex(latex);
      expect(parts).toEqual(["text ", "$x^2$", " more ", "$$y^2$$", " text"]);
    });

    test("handles inline math with parentheses", () => {
      const latex = "text \\(x^2\\) more text";
      const parts = splitLatex(latex);
      expect(parts).toEqual(["text ", "\\(x^2\\)", " more text"]);
    });

    test("handles block math with brackets", () => {
      const latex = "text \\[x^2\\] more text";
      const parts = splitLatex(latex);
      expect(parts).toEqual(["text ", "\\[x^2\\]", " more text"]);
    });
  });

  describe("isInlineLatexFragment", () => {
    test("matches inline LaTeX with parentheses", () => {
      const match = isInlineLatexFragment("\\(x^2 + y^2\\)");
      expect(match).toBeTruthy();
      expect(match![1]).toBe("x^2 + y^2");
    });

    test("does not match block LaTeX", () => {
      expect(isInlineLatexFragment("$$x^2$$")).toBeNull();
      expect(isInlineLatexFragment("\\[x^2\\]")).toBeNull();
    });

    test("does not match simple dollar signs", () => {
      expect(isInlineLatexFragment("$x$")).toBeNull();
    });
  });

  describe("isSmallVariableLatex", () => {
    test("matches simple variables", () => {
      const match = isSmallVariableLatex("\\(x\\)");
      expect(match).toBeTruthy();
      expect(match!.content).toBe("x");
    });

    test("matches short variables", () => {
      const match = isSmallVariableLatex("\\(ab\\)");
      expect(match).toBeTruthy();
      expect(match!.content).toBe("ab");
    });

    test("does not match complex expressions", () => {
      expect(isSmallVariableLatex("\\(x^2\\)")).toBeNull();
      expect(isSmallVariableLatex("\\(\\frac{x}{y}\\)")).toBeNull();
      expect(isSmallVariableLatex("\\(x + y\\)")).toBeNull();
    });

    test("does not match long variables", () => {
      expect(isSmallVariableLatex("\\(variable\\)")).toBeNull();
    });
  });

  describe("isSimpleVariable", () => {
    test("matches simple single letter variables", () => {
      const match = isSimpleVariable("$x$");
      expect(match).toBeTruthy();
      expect(match!.content).toBe("x");
    });

    test("matches short variable names", () => {
      const match = isSimpleVariable("$abc$");
      expect(match).toBeTruthy();
      expect(match!.content).toBe("abc");
    });

    test("does not match expressions with operators", () => {
      expect(isSimpleVariable("$x + y$")).toBeNull();
      expect(isSimpleVariable("$x^2$")).toBeNull();
      expect(isSimpleVariable("$x = 1$")).toBeNull();
    });

    test("does not match long variable names", () => {
      expect(isSimpleVariable("$variable$")).toBeNull();
    });
  });

  describe("isBlockLatexFragment", () => {
    test("matches double dollar block math", () => {
      const match = isBlockLatexFragment("$$x^2 + y^2$$");
      expect(match).toBeTruthy();
    });

    test("matches bracket block math", () => {
      const match = isBlockLatexFragment("\\[x^2 + y^2\\]");
      expect(match).toBeTruthy(); // We support bracket block math
      if (match) {
        expect(match[1]).toBe("x^2 + y^2");
      }
    });

    test("does not match inline math", () => {
      expect(isBlockLatexFragment("$x$")).toBeNull();
      expect(isBlockLatexFragment("\\(x\\)")).toBeNull();
    });
  });

  describe("isSelectiveInlineLatex", () => {
    test("matches math with operators", () => {
      const match = isSelectiveInlineLatex("$x + y$");
      expect(match).toBeTruthy();
      expect(match![1]).toBe("x + y");
    });

    test("matches math with functions", () => {
      const match = isSelectiveInlineLatex("$\\sin(x)$");
      expect(match).toBeTruthy();
    });

    test("matches math with fractions", () => {
      const match = isSelectiveInlineLatex("$\\frac{x}{y}$");
      expect(match).toBeTruthy();
    });

    test("matches set notation", () => {
      const match = isSelectiveInlineLatex("${a, b, c}$");
      expect(match).toBeTruthy();
    });

    test("does not match simple variables", () => {
      expect(isSelectiveInlineLatex("$x$")).toBeNull();
      expect(isSelectiveInlineLatex("$variable$")).toBeNull();
    });

    test("matches chemical formulas", () => {
      const match = isSelectiveInlineLatex("$H_2O$");
      expect(match).toBeTruthy();
    });
  });

  describe("isLatexEnvironment", () => {
    test("matches environment structure", () => {
      const match = isLatexEnvironment(
        "\\begin{itemize}\\item test\\end{itemize}"
      );
      expect(match).toBeTruthy();
      expect(match![1]).toBe("itemize");
    });

    test("does not match mismatched environments", () => {
      expect(
        isLatexEnvironment("\\begin{itemize}\\item test\\end{enumerate}")
      ).toBeNull();
    });

    test("does not match incomplete environments", () => {
      expect(isLatexEnvironment("\\begin{itemize}\\item test")).toBeNull();
    });
  });

  describe("validateLatexInput", () => {
    test("allows safe LaTeX commands", () => {
      expect(validateLatexInput("$x^2 + y^2$")).toBe(true);
      expect(
        validateLatexInput("\\begin{itemize}\\item test\\end{itemize}")
      ).toBe(true);
      expect(validateLatexInput("\\frac{x}{y}")).toBe(true);
    });

    test("rejects dangerous LaTeX commands", () => {
      expect(validateLatexInput("\\input{file.tex}")).toBe(false);
      expect(validateLatexInput("\\include{malicious}")).toBe(false);
      expect(validateLatexInput("\\write18{rm -rf /}")).toBe(false);
      expect(validateLatexInput("\\immediate\\write")).toBe(false);
    });
  });

  describe("sanitizeLatexContent", () => {
    test("removes dangerous commands", () => {
      const input = "Safe content \\input{file.tex} more safe content";
      const output = sanitizeLatexContent(input);
      expect(output).toBe("Safe content  more safe content");
    });

    test("preserves safe content", () => {
      const input = "$x^2 + y^2$ and \\frac{a}{b}";
      const output = sanitizeLatexContent(input);
      expect(output).toBe(input);
    });
  });

  // Property-based tests
  describe("property tests", () => {
    test("findTopLevelEnvs result count is consistent", () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.string())),
          (envPairs) => {
            const text = envPairs
              .map(
                ([name, content]) => `\\begin{${name}}${content}\\end{${name}}`
              )
              .join(" ");
            const envs = findTopLevelEnvs(text);
            expect(envs.length).toBeLessThanOrEqual(envPairs.length);
          }
        )
      );
    });

    test("splitLatex preserves content", () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const parts = splitLatex(input);
          const rejoined = parts.join("");
          expect(rejoined).toBe(input);
        })
      );
    });
  });
});
