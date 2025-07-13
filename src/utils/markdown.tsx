import { isValidElement } from "react";
import {
  isSimpleVariable,
  isSmallVariableLatex,
  isSelectiveInlineLatex,
} from "./latex";

// Process text to render small variables inline as bold/italic
export function processTextWithSmallVariables(text: string): JSX.Element[] {
  // Split by both $...$ simple variables and \(...\) LaTeX variables
  const parts = text.split(
    /(\$[a-zA-Z][a-zA-Z0-9_]{0,2}\$|\\\([a-zA-Z][a-zA-Z0-9]{0,2}\\\))/g
  );

  return parts
    .map((part, index) => {
      // Check for simple variables first
      const simpleVarMatch = isSimpleVariable(part);
      if (simpleVarMatch) {
        return (
          <span
            key={index}
            className="font-bold"
            role="text"
            aria-label={`Variable ${simpleVarMatch.content}`}
          >
            {simpleVarMatch.content}
          </span>
        );
      }

      // Check for small LaTeX variables
      const smallVarMatch = isSmallVariableLatex(part);
      if (smallVarMatch) {
        return (
          <span
            key={index}
            className="font-bold italic"
            role="math"
            aria-label={`Mathematical variable ${smallVarMatch.content}`}
          >
            {smallVarMatch.content}
          </span>
        );
      }
      // Wrap text in span to ensure consistent JSX element type
      return <span key={index}>{part}</span>;
    })
    .filter((part) => {
      // Filter out empty text spans
      const isEmptyTextSpan = part.props.children === "";
      return !isEmptyTextSpan;
    });
}

// Render markdown headings as HTML elements with LaTeX support
export function renderHeading(text: string, level: number): JSX.Element {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses = {
    1: "text-3xl font-bold mb-4 mt-6",
    2: "text-2xl font-semibold mb-3 mt-5",
    3: "text-xl font-medium mb-2 mt-4",
    4: "text-lg font-medium mb-2 mt-3",
    5: "text-base font-medium mb-1 mt-2",
    6: "text-sm font-medium mb-1 mt-2",
  };

  // Create a clean ID for the heading
  const headingId = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  // Process mixed content (text + LaTeX) within the heading
  const processedContent = processMixedContent(text);

  return (
    <HeadingTag
      id={headingId}
      className={sizeClasses[level as keyof typeof sizeClasses]}
      tabIndex={-1}
    >
      {processedContent}
    </HeadingTag>
  );
}

// Process mixed content (text + LaTeX) for inline rendering
export function processMixedContent(text: string): JSX.Element[] {
  const elements: JSX.Element[] = [];

  // Find all LaTeX expressions in the text
  const mathPattern =
    /(\\\[.*?\\\]|\$\$.*?\$\$|\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
  const matches = [];
  let match;

  while ((match = mathPattern.exec(text)) !== null) {
    // Skip simple variables and small LaTeX variables - these will be handled separately
    if (match[0].startsWith("$") && !match[0].startsWith("$$")) {
      const simpleVarCheck = isSimpleVariable(match[0]);
      if (simpleVarCheck) continue;
    }

    if (match[0].startsWith("\\(") && match[0].endsWith("\\)")) {
      const smallVarCheck = isSmallVariableLatex(match[0]);
      if (smallVarCheck) continue;
    }

    // Additional filtering for $...$
    if (match[0].startsWith("$") && !match[0].startsWith("$$")) {
      const selectiveMatch = isSelectiveInlineLatex(match[0]);
      if (!selectiveMatch) continue;
    }

    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
    });
  }

  let currentIndex = 0;
  matches.forEach((mathMatch, index) => {
    // Add text before this math
    if (mathMatch.start > currentIndex) {
      const textBefore = text.slice(currentIndex, mathMatch.start);
      if (textBefore) {
        // Process simple variables in the text before
        const processedTextParts = processTextWithSmallVariables(textBefore);
        elements.push(...processedTextParts);
      }
    }

    // Add the math element - this would be handled by the LaTeX renderer
    // For now, we'll just add a placeholder span
    elements.push(
      <span key={`math-${index}`} className="math-content">
        {mathMatch.content}
      </span>
    );

    currentIndex = mathMatch.end;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      const processedTextParts = processTextWithSmallVariables(remainingText);
      elements.push(...processedTextParts);
    }
  }

  // If no math was found, just process the whole text for simple variables
  if (matches.length === 0) {
    return processTextWithSmallVariables(text);
  }

  // Filter out empty elements
  return elements.filter((el) => {
    if (isValidElement(el)) {
      const props = el.props as any;
      if (typeof props.children === "string") {
        return props.children.trim() !== "";
      }
    }
    return true;
  });
}

// Validate markdown content for security
export function validateMarkdownContent(content: string): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  // Check for reasonable length to prevent DoS
  if (content.length > 100000) {
    return false;
  }

  // Basic checks for malicious patterns
  const dangerousPatterns = [
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<script[^>]*>/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(content));
}

// Sanitize markdown content
export function sanitizeMarkdownContent(content: string): string {
  // Remove potentially dangerous HTML elements and attributes
  return content
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/vbscript:/gi, "");
}
