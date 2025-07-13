import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import type { RichTextProps, ProcessingOptions } from "../../types";
import {
  validateMarkdownContent,
  validateLatexInput,
  findTopLevelEnvs,
  processTextWithSmallVariables,
  renderHeading,
} from "../../utils";
import { Smiles } from "../Smiles";
import { ContentParser } from "./processors/ContentParser";
import { renderLatex } from "./processors/LatexProcessor";
import { processTextFragmentWithPlaceholders } from "./processors/MarkdownProcessor";

/**
 * RichText handles *any* string coming from the backend and figures out the best way to render it.
 *
 * CONTENT PROCESSING PIPELINE:
 * 1. SMILES Detection: Finds <smiles>...</smiles> tags for chemical structure rendering
 * 2. Small Variable LaTeX: Detects simple \(m\), \(k\), etc. and renders as bold+italic HTML
 * 3. LaTeX Math Detection:
 *    - Block math: \[...\] and $$...$$ (creates new lines)
 *    - Inline math: \(...\) (stays inline, excluding small variables)
 *    - Selective $...$ math: Only complex expressions to avoid false positives like "F_m"
 * 4. LaTeX Environments: \begin{env}...\end{env} for lists, equations, etc.
 * 5. Markdown Headings: ###, ##, # converted to HTML heading elements
 * 6. Remaining Content: Processed as markdown or plain text based on renderAsMarkdown flag
 *
 * @param content - The content string to render
 * @param renderAsMarkdown - Whether to treat non-special content as markdown (default: true)
 * @param inline - Whether to render content inline without prose wrapper (default: false)
 * @returns Rendered JSX elements
 */
export const RichText = ({
  content,
  renderAsMarkdown = true,
  inline = false,
}: RichTextProps) => {
  // Validate input content
  if (!content || typeof content !== "string") {
    return null;
  }

  // Security validation
  if (!validateMarkdownContent(content)) {
    return (
      <div
        className="error-message bg-red-50 border border-red-200 rounded-md p-3"
        role="alert"
        aria-live="polite"
      >
        <p className="text-red-800">Invalid or potentially unsafe content</p>
      </div>
    );
  }

  // Check if content has LaTeX environments or complex structures that need special handling
  const hasComplexStructures = (text: string): boolean => {
    return (
      findTopLevelEnvs(text).length > 0 || // Has LaTeX environments
      text.includes("\\[") || // Has bracket block math
      text.includes("$$") // Has double dollar block math
    );
  };

  // For content with complex structures, use the complex processing approach
  if (hasComplexStructures(content) || !renderAsMarkdown) {
    return renderWithComplexProcessing(content, { renderAsMarkdown, inline });
  }

  // For simple markdown content with inline math, use placeholder approach
  return renderWithPlaceholders(content, { inline });
};

// Complex processing approach for content with environments, headings, etc.
function renderWithComplexProcessing(
  content: string,
  options: ProcessingOptions
): JSX.Element {
  const { renderAsMarkdown, inline } = options;
  const parser = new ContentParser(content);
  const matches = parser.parseContent();

  // Separate block-level matches from inline matches
  const blockMatches = matches.filter((match) => {
    if (match.type === "math") {
      return match.content.match(/^(\$\$|\\\[)/); // Block math
    }
    return (
      match.type === "smiles" ||
      match.type === "heading" ||
      match.type === "env"
    );
  });

  const elements: JSX.Element[] = [];
  let currentIndex = 0;

  // Process only block-level matches, leaving inline math to be processed with text
  blockMatches.forEach((match, index) => {
    // Add text before this match (including any inline math)
    if (match.start > currentIndex) {
      const textBefore = content.slice(currentIndex, match.start);
      if (textBefore.trim()) {
        if (renderAsMarkdown) {
          const processedElement = processTextFragmentWithPlaceholders(
            textBefore,
            index
          );
          elements.push(processedElement);
        } else {
          const processedParts = processTextWithSmallVariables(textBefore);
          elements.push(
            <span key={`text-${index}`} className="whitespace-pre-line">
              {processedParts}
            </span>
          );
        }
      }
    }

    // Render the matched content (only block-level items)
    elements.push(renderMatchedContent(match, index));
    currentIndex = match.end;
  });

  // Add remaining text (including any inline math)
  if (currentIndex < content.length) {
    const remainingText = content.slice(currentIndex);
    if (remainingText.trim()) {
      if (renderAsMarkdown) {
        const processedElement = processTextFragmentWithPlaceholders(
          remainingText,
          currentIndex
        );
        elements.push(processedElement);
      } else {
        const processedParts = processTextWithSmallVariables(remainingText);
        elements.push(
          <span key="text-final" className="whitespace-pre-line">
            {processedParts}
          </span>
        );
      }
    }
  }

  if (inline) {
    return (
      <span
        className="prose-inline"
        role="presentation"
        aria-label="Scientific content with mixed formatting"
      >
        {elements.length > 0
          ? elements
          : renderFallbackContent(content, renderAsMarkdown)}
      </span>
    );
  }

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      role="article"
      aria-label="Scientific document content"
    >
      {elements.length > 0
        ? elements
        : renderFallbackContent(content, renderAsMarkdown)}
    </div>
  );
}

// Render matched content based on type
function renderMatchedContent(match: any, index: number): JSX.Element {
  switch (match.type) {
    case "smiles":
      const smilesCode = match.content.match(/<smiles>(.*?)<\/smiles>/)?.[1];
      if (smilesCode) {
        return (
          <Smiles
            key={`smiles-${index}`}
            code={smilesCode}
            errorCallback={(error) => console.error(error)}
          />
        );
      }
      break;

    case "heading":
      const headingMatch = match.content.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        return <div key={`heading-${index}`}>{renderHeading(text, level)}</div>;
      }
      break;

    case "math":
    case "env":
      // Validate LaTeX before rendering
      if (!validateLatexInput(match.content)) {
        return (
          <div
            key={`error-${index}`}
            className="bg-red-50 border border-red-200 rounded-md p-3"
            role="alert"
            aria-live="polite"
            aria-label="LaTeX rendering error"
          >
            <p className="text-red-800">Invalid LaTeX content</p>
          </div>
        );
      }

      const isBlockMath = match.content.match(/^(\$\$|\\\[)/);
      if (isBlockMath) {
        return (
          <div
            key={`latex-${index}`}
            role="math"
            aria-label={`Mathematical expression: ${match.content
              .replace(/[\$\\\[\]]/g, "")
              .trim()}`}
          >
            {renderLatex(match.content, false)}
          </div>
        );
      } else {
        return (
          <span
            key={`latex-${index}`}
            role="math"
            aria-label={`Inline math: ${match.content
              .replace(/[\$\\\(\)]/g, "")
              .trim()}`}
          >
            {renderLatex(match.content, true)}
          </span>
        );
      }
  }

  // Fallback
  return <span key={`fallback-${index}`}>{match.content}</span>;
}

// Placeholder-based approach for simple markdown with inline math
function renderWithPlaceholders(
  content: string,
  options: { inline: boolean }
): JSX.Element {
  const { inline } = options;

  // For simple content, just process with markdown
  const processedElement = processTextFragmentWithPlaceholders(content, 0);

  if (inline) {
    return (
      <span
        className="prose-inline"
        role="presentation"
        aria-label="Scientific content with mixed formatting"
      >
        {processedElement}
      </span>
    );
  }

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      role="article"
      aria-label="Scientific document content"
    >
      {processedElement}
    </div>
  );
}

// Fallback content rendering
function renderFallbackContent(
  content: string,
  renderAsMarkdown: boolean
): JSX.Element {
  if (renderAsMarkdown) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content
          .replace(/\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g, "**$1**")
          .replace(/\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g, "***$1***")}
      </ReactMarkdown>
    );
  } else {
    return (
      <span className="whitespace-pre-line">
        {processTextWithSmallVariables(content)}
      </span>
    );
  }
}
