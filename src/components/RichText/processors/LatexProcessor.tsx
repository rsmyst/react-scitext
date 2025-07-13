import { BlockMath, InlineMath } from "react-katex";
import {
  isLatexEnvironment,
  isBlockLatexFragment,
  isInlineLatexFragment,
  isSelectiveInlineLatex,
  isSimpleVariable,
  isSmallVariableLatex,
  findTopLevelEnvs,
  splitLatex,
} from "../../../utils";
import { Smiles } from "../../Smiles";

// Parse LaTeX list environments
export function parseLatexList(
  content: string,
  environment: string
): (JSX.Element | null)[] {
  // Remove the \begin{env} and \end{env} tags
  const innerContent = content
    .replace(/^\\begin\{[^}]+\}/s, "")
    .replace(/\\end\{[^}]+\}$/s, "")
    .trim();

  // Find all top-level nested environments and replace them with placeholders
  const subEnvs = findTopLevelEnvs(innerContent);
  const placeholders: { [key: string]: string } = {};
  let processedContent = "";
  let lastIndex = 0;

  subEnvs.forEach((env, i) => {
    const placeholder = `__LATEX_ENV_PLACEHOLDER_${i}__`;
    placeholders[placeholder] = env.content;
    processedContent += innerContent.substring(lastIndex, env.start);
    processedContent += placeholder;
    lastIndex = env.end;
  });
  processedContent += innerContent.substring(lastIndex);

  // Split by \item at the current level
  let items = processedContent.split(/\\item/).filter((item) => item.trim());

  // If no \item found, the whole content might be a single item
  if (items.length === 0 && processedContent.trim()) {
    items = [processedContent.trim()];
  }

  return items
    .map((item, index) => {
      const trimmedItem = item.trim();

      // A function to render an item's content, substituting placeholders back
      const renderItemContent = (itemContent: string) => {
        const placeholderRegex = /(__LATEX_ENV_PLACEHOLDER_\d+__)/g;
        const parts = itemContent.split(placeholderRegex).filter(Boolean);

        return parts.map((part, i) => {
          if (placeholders[part]) {
            // For now, render nested content as text - TODO: resolve circular dependency
            return <span key={i}>{placeholders[part]}</span>;
          }

          // Process LaTeX content in the part using the same approach as MarkdownProcessor
          const placeholderMap = new Map<string, JSX.Element>();
          let placeholderCounter = 0;
          let processedPart = part;

          // Handle SMILES first
          const smilesPattern = /<smiles>(.*?)<\/smiles>/g;
          processedPart = processedPart.replace(
            smilesPattern,
            (_, smilesCode) => {
              const placeholder = `SMILES_PLACEHOLDER_${placeholderCounter++}`;
              placeholderMap.set(
                placeholder,
                <Smiles
                  key={placeholder}
                  code={smilesCode}
                  errorCallback={(error: unknown) => console.error(error)}
                />
              );
              return placeholder;
            }
          );

          // Handle inline math expressions (not block math)
          const inlineMathPattern =
            /(\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
          processedPart = processedPart.replace(inlineMathPattern, (match) => {
            // Check for simple variables first
            const simpleVarCheck = isSimpleVariable(match);
            if (simpleVarCheck) {
              return match; // Keep as is, will be processed by markdown
            }

            // Skip small LaTeX variables
            if (match.startsWith("\\(") && match.endsWith("\\)")) {
              const smallVarCheck = isSmallVariableLatex(match);
              if (smallVarCheck) {
                return match; // Keep as is, will be processed by markdown
              }
            }

            // Additional filtering for $...$
            if (match.startsWith("$") && !match.startsWith("$$")) {
              const selectiveMatch = isSelectiveInlineLatex(match);
              if (!selectiveMatch) return match;
            }

            const placeholder = `MATH_PLACEHOLDER_${placeholderCounter++}`;
            placeholderMap.set(
              placeholder,
              <InlineMath
                key={placeholder}
                math={
                  match.startsWith("\\(")
                    ? match.slice(2, -2)
                    : match.slice(1, -1)
                }
              />
            );
            return placeholder;
          });

          // Process simple variables for markdown
          processedPart = processedPart.replace(
            /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
            "**$1**"
          );

          // Process small LaTeX variables for markdown
          processedPart = processedPart.replace(
            /\\\(([a-zA-Z][a-zA-Z0-9]{0,2})\\\)/g,
            "***$1***"
          );

          // Replace placeholders with actual elements
          let result: (string | JSX.Element)[] = [processedPart];
          placeholderMap.forEach((element, placeholder) => {
            result = result.flatMap((item) => {
              if (typeof item === "string" && item.includes(placeholder)) {
                const parts = item.split(placeholder);
                const newResult: (string | JSX.Element)[] = [];
                for (let j = 0; j < parts.length; j++) {
                  if (j > 0) {
                    newResult.push(element);
                  }
                  if (parts[j]) {
                    newResult.push(parts[j]);
                  }
                }
                return newResult;
              }
              return [item];
            });
          });

          return <span key={i}>{result}</span>;
        });
      };

      // Handle description list items
      if (environment === "description") {
        const match = trimmedItem.match(/^\[([^\]]+)\]\s*(.*)$/s);
        if (match) {
          const [, term, description] = match;
          return (
            <div key={index} className="mb-2">
              <dt className="font-semibold">{term}</dt>
              <dd className="ml-4">{renderItemContent(description)}</dd>
            </div>
          );
        } else {
          return (
            <div key={index} className="mb-2">
              <dd className="ml-0">{renderItemContent(trimmedItem)}</dd>
            </div>
          );
        }
      }

      return (
        <li key={index} className="mb-1">
          {renderItemContent(trimmedItem)}
        </li>
      );
    })
    .filter(Boolean); // Remove null items
}

// Render LaTeX environments as HTML
export function renderLatexEnvironment(
  environment: string,
  content: string
): JSX.Element {
  const items = parseLatexList(content, environment);

  // If no items found, show the raw content
  if (items.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md my-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
          Malformed LaTeX {environment} environment:
        </p>
        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {content}
        </pre>
      </div>
    );
  }

  switch (environment) {
    case "enumerate":
      return (
        <ol className="list-decimal list-outside space-y-1 my-4 pl-5">
          {items}
        </ol>
      );
    case "itemize":
      return (
        <ul className="list-disc list-outside space-y-1 my-4 pl-5">{items}</ul>
      );
    case "description":
      return <dl className="space-y-2 my-4 pl-5">{items}</dl>;
    default:
      // For unknown environments, show in a styled container
      return (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-md my-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            LaTeX {environment} environment:
          </p>
          <div className="pl-4">
            {items.length > 0 ? (
              <ul className="list-none space-y-1">{items}</ul>
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            )}
          </div>
        </div>
      );
  }
}

// Render LaTeX content
export function renderLatex(latex: string, forceInline = false): JSX.Element {
  // Check if this is a LaTeX environment first
  const envMatch = isLatexEnvironment(latex);
  if (envMatch) {
    const [, environment] = envMatch;
    return renderLatexEnvironment(environment, latex);
  }

  // For single LaTeX expressions, determine if it's block or inline
  const blockMatch = isBlockLatexFragment(latex);
  const inlineMatch = isInlineLatexFragment(latex);
  const selectiveMatch = isSelectiveInlineLatex(latex);

  if (blockMatch && !forceInline) {
    // It's block LaTeX math - render as block with div wrapper
    // Extract content from \[...\] (index 1) or $$...$$ (index 2)
    const mathContent = blockMatch[1] || blockMatch[2];
    return (
      <div className="my-2">
        <BlockMath math={mathContent} />
      </div>
    );
  } else if (inlineMatch) {
    // It's inline LaTeX math - render inline
    return <InlineMath math={inlineMatch[1]} />;
  } else if (selectiveMatch) {
    // It's selective inline math - render inline
    return <InlineMath math={selectiveMatch[1]} />;
  } else {
    // Check for simple variables in $...$ format
    const simpleVarMatch = isSimpleVariable(latex);
    if (simpleVarMatch) {
      // Render as bold HTML
      return <span className="font-bold">{simpleVarMatch.content}</span>;
    }

    // Check for small variable LaTeX expressions
    const smallVarMatch = isSmallVariableLatex(latex);
    if (smallVarMatch) {
      // Render as bold and italic HTML
      return <span className="font-bold italic">{smallVarMatch.content}</span>;
    }
  }

  // If we can't identify the LaTeX type, split and process parts
  const parts = splitLatex(latex);

  return (
    <>
      {parts.map((part, index) => {
        const blockMatch = isBlockLatexFragment(part);
        if (blockMatch && !forceInline) {
          const mathContent = blockMatch[1] || blockMatch[2];
          return (
            <div key={index} className="my-2">
              <BlockMath math={mathContent} />
            </div>
          );
        } else if (blockMatch && forceInline) {
          const mathContent = blockMatch[1] || blockMatch[2];
          return <InlineMath key={index} math={mathContent} />;
        } else {
          const simpleVarMatch = isSimpleVariable(part);
          if (simpleVarMatch) {
            return (
              <span key={index} className="font-bold">
                {simpleVarMatch.content}
              </span>
            );
          } else {
            const smallVarMatch = isSmallVariableLatex(part);
            if (smallVarMatch) {
              return (
                <span key={index} className="font-bold italic">
                  {smallVarMatch.content}
                </span>
              );
            } else {
              const inlineMatch = isInlineLatexFragment(part);
              if (inlineMatch) {
                return <InlineMath key={index} math={inlineMatch[1]} />;
              } else {
                const selectiveMatch = isSelectiveInlineLatex(part);
                if (selectiveMatch) {
                  return <InlineMath key={index} math={selectiveMatch[1]} />;
                } else {
                  return (
                    <span className="whitespace-pre-line" key={index}>
                      {part}
                    </span>
                  );
                }
              }
            }
          }
        }
      })}
    </>
  );
}
