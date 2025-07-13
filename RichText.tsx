import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Smiles } from './Smiles';

// Types for LaTeX environments
export type LatexEnv = {
  start: number;
  end: number;
  content: string;
};

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
    if (tag.type === 'begin') {
      stack.push(tag);
    } else if (tag.type === 'end' && stack.length > 0) {
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
export const splitLatex = (latex: string): string[] => {
  // Capture \( ... \), $$..$$, $..$ and \[..\].
  // The order is important, since $$...$$ also matches for $...$.
  return latex.split(/(\\\(.+?\\\)|\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\])/gs);
};

// Check for inline LaTeX - only matches \(...\) delimiters for true inline math
// We avoid matching simple $...$ to prevent false positives with variables like F_m
export const isInlineLatexFragment = (fragment: string) => {
  return fragment.match(/^\\\((.+?)\\\)$/s);
};

// Check for small single-variable LaTeX expressions that should be rendered as bold/italic HTML
export const isSmallVariableLatex = (fragment: string) => {
  const match = fragment.match(/^\\\(\s*([a-zA-Z_0-9]{1,3})\s*\\\)$/s);
  if (!match) return null;

  const content = match[1];
  // Only match simple variables (1-3 characters, letters, numbers, underscores)
  // Avoid complex expressions that should remain as LaTeX
  if (
    content.includes('\\') ||
    content.includes('{') ||
    content.includes('}') ||
    content.includes('^') ||
    content.includes('_') ||
    content.includes('frac')
  ) {
    return null;
  }

  return match;
};

// Check for simple variables in $...$ format that should be rendered as bold HTML
export const isSimpleVariable = (fragment: string) => {
  const match = fragment.match(/^\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$$/s);
  if (!match) return null;

  const content = match[1];
  // Only match simple single letters or very short variable names
  // Avoid complex expressions that should remain as LaTeX
  if (
    content.includes('\\') ||
    content.includes('{') ||
    content.includes('}') ||
    content.includes('^') ||
    content.includes('_') ||
    content.includes('frac') ||
    content.includes('+') ||
    content.includes('-') ||
    content.includes('*') ||
    content.includes('/') ||
    content.includes('=') ||
    content.includes('(') ||
    content.includes(')') ||
    content.length > 3
  ) {
    return null;
  }

  return match;
};

// Check for block LaTeX - matches \[...\] and $$...$$ for display math
export const isBlockLatexFragment = (fragment: string) => {
  return (
    fragment.match(/^\\\[(.+?)\\\]$/s) || fragment.match(/^\$\$(.*?)\$\$$/s)
  );
};

// Check for single $ inline math - more selective to avoid false positives
// Only matches if it contains mathematical operators, functions, or complex expressions
export const isSelectiveInlineLatex = (fragment: string) => {
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
};

// Check if fragment is a LaTeX environment
export const isLatexEnvironment = (fragment: string) => {
  return fragment.match(/^\\begin\{([^}]+)\}(.*?)\\end\{\1\}$/s);
};

// Parse LaTeX list environments
const parseLatexList = (
  content: string,
  environment: string
): (JSX.Element | null)[] => {
  // Remove the \begin{env} and \end{env} tags
  const innerContent = content
    .replace(/^\\begin\{[^}]+\}/s, '')
    .replace(/\\end\{[^}]+\}$/s, '')
    .trim();

  // Find all top-level nested environments and replace them with placeholders
  const subEnvs = findTopLevelEnvs(innerContent);
  const placeholders: { [key: string]: string } = {};
  let processedContent = '';
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
            return <RichText key={i} content={placeholders[part]} />;
          }
          return <RichText key={i} content={part} />;
        });
      };

      // Handle description list items
      if (environment === 'description') {
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
};

// Render LaTeX environments as HTML
const renderLatexEnvironment = (
  environment: string,
  content: string
): JSX.Element => {
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
    case 'enumerate':
      return (
        <ol className="list-decimal list-outside space-y-1 my-4 pl-5">
          {items}
        </ol>
      );
    case 'itemize':
      return (
        <ul className="list-disc list-outside space-y-1 my-4 pl-5">{items}</ul>
      );
    case 'description':
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
};

// Render LaTeX content
const renderLatex = (latex: string, forceInline = false): JSX.Element => {
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
    // Extract content from \[...\] or $$..$$
    const mathContent = blockMatch[1] || blockMatch[2] || blockMatch[0];
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
      return <span className="font-bold">{simpleVarMatch[1]}</span>;
    }

    // Check for small variable LaTeX expressions
    const smallVarMatch = isSmallVariableLatex(latex);
    if (smallVarMatch) {
      // Render as bold and italic HTML
      return <span className="font-bold italic">{smallVarMatch[1]}</span>;
    }
  }

  // If we can't identify the LaTeX type, split and process parts
  const parts = splitLatex(latex);

  return (
    <>
      {parts.map((part, index) => {
        // The order is important, since $$...$$ also matches for $...$.
        const blockMatch = isBlockLatexFragment(part);
        if (blockMatch && !forceInline) {
          // It's LaTeX math - render as block only if not forced inline
          // Extract content from \[...\] or $$..$$
          const mathContent = blockMatch[1] || blockMatch[2] || blockMatch[0];
          return (
            <div key={index} className="my-2">
              <BlockMath math={mathContent} />
            </div>
          );
        } else if (blockMatch && forceInline) {
          // Force block math to render inline
          const mathContent = blockMatch[1] || blockMatch[2] || blockMatch[0];
          return <InlineMath key={index} math={mathContent} />;
        } else {
          // Check for simple variables in $...$ format first
          const simpleVarMatch = isSimpleVariable(part);
          if (simpleVarMatch) {
            // Render as bold HTML
            return (
              <span key={index} className="font-bold">
                {simpleVarMatch[1]}
              </span>
            );
          } else {
            // Check for small variable LaTeX expressions
            const smallVarMatch = isSmallVariableLatex(part);
            if (smallVarMatch) {
              // Render as bold and italic HTML
              return (
                <span key={index} className="font-bold italic">
                  {smallVarMatch[1]}
                </span>
              );
            } else {
              const inlineMatch = isInlineLatexFragment(part);
              if (inlineMatch) {
                // Render true inline math using \(...\) delimiters
                return <InlineMath key={index} math={inlineMatch[1]} />;
              } else {
                // Check for selective $...$ inline math
                const selectiveMatch = isSelectiveInlineLatex(part);
                if (selectiveMatch) {
                  return <InlineMath key={index} math={selectiveMatch[1]} />;
                } else {
                  // It's regular text
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
};

// Process mixed content (text + LaTeX) for inline rendering
const processMixedContent = (text: string): JSX.Element[] => {
  const elements: JSX.Element[] = [];

  // Find all LaTeX expressions in the text
  const mathPattern =
    /(\\\[.*?\\\]|\$\$.*?\$\$|\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
  const matches = [];
  let match;

  while ((match = mathPattern.exec(text)) !== null) {
    // Skip simple variables and small LaTeX variables - these will be handled separately
    if (match[0].startsWith('$') && !match[0].startsWith('$$')) {
      const simpleVarCheck = isSimpleVariable(match[0]);
      if (simpleVarCheck) continue;
    }

    if (match[0].startsWith('\\(') && match[0].endsWith('\\)')) {
      const smallVarCheck = isSmallVariableLatex(match[0]);
      if (smallVarCheck) continue;
    }

    // Additional filtering for $...$
    if (match[0].startsWith('$') && !match[0].startsWith('$$')) {
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

    // Add the math element
    elements.push(
      <span key={`math-${index}`}>{renderLatex(mathMatch.content, true)}</span>
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
    if (React.isValidElement(el)) {
      const props = el.props as any;
      if (typeof props.children === 'string') {
        return props.children.trim() !== '';
      }
    }
    return true;
  });
};

// Render markdown headings as HTML elements with LaTeX support
const renderHeading = (text: string, level: number): JSX.Element => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses = {
    1: 'text-3xl font-bold mb-4 mt-6',
    2: 'text-2xl font-semibold mb-3 mt-5',
    3: 'text-xl font-medium mb-2 mt-4',
    4: 'text-lg font-medium mb-2 mt-3',
    5: 'text-base font-medium mb-1 mt-2',
    6: 'text-sm font-medium mb-1 mt-2',
  };

  // Process mixed content (text + LaTeX) within the heading
  const processedContent = processMixedContent(text);

  return (
    <HeadingTag className={sizeClasses[level as keyof typeof sizeClasses]}>
      {processedContent}
    </HeadingTag>
  );
};

// Split content to identify SMILES code
export const splitSmiles = (content: string): string[] => {
  return content.split(/(<smiles>.*?<\/smiles>)/gs);
};

// Check if fragment is SMILES code
export const isSmilesCode = (fragment: string) => {
  return fragment.match(/<smiles>(.*?)<\/smiles>/);
};

// Process text to render small variables inline as bold/italic
const processTextWithSmallVariables = (text: string): JSX.Element[] => {
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
          <span key={index} className="font-bold">
            {simpleVarMatch[1]}
          </span>
        );
      }

      // Check for small LaTeX variables
      const smallVarMatch = isSmallVariableLatex(part);
      if (smallVarMatch) {
        return (
          <span key={index} className="font-bold italic">
            {smallVarMatch[1]}
          </span>
        );
      }
      // Wrap text in span to ensure consistent JSX element type
      return <span key={index}>{part}</span>;
    })
    .filter((part, index, arr) => {
      // Filter out empty text spans
      const isEmptyTextSpan = part.props.children === '';
      return !isEmptyTextSpan;
    });
};

// Process a text fragment with placeholders for inline math (used in complex processing)
const processTextFragmentWithPlaceholders = (
  textFragment: string,
  index: number
): JSX.Element => {
  const placeholderMap = new Map<string, JSX.Element>();
  let placeholderCounter = 0;
  let processedContent = textFragment;

  // Handle SMILES first
  const smilesPattern = /<smiles>(.*?)<\/smiles>/g;
  processedContent = processedContent.replace(
    smilesPattern,
    (match, smilesCode) => {
      const placeholder = `SMILES_PLACEHOLDER_${placeholderCounter++}`;
      placeholderMap.set(
        placeholder,
        <Smiles
          key={placeholder}
          code={smilesCode}
          errorCallback={(error) => console.error(error)}
        />
      );
      return placeholder;
    }
  );
  // Handle inline math expressions (not block math)
  const inlineMathPattern = /(\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
  processedContent = processedContent.replace(inlineMathPattern, (match) => {
    // Check for simple variables first
    const simpleVarCheck = isSimpleVariable(match);
    if (simpleVarCheck) {
      return match; // Keep as is, will be processed by markdown
    }

    // Skip small LaTeX variables
    if (match.startsWith('\\(') && match.endsWith('\\)')) {
      const smallVarCheck = isSmallVariableLatex(match);
      if (smallVarCheck) {
        return match; // Keep as is, will be processed by markdown
      }
    }

    // Additional filtering for $...$
    if (match.startsWith('$') && !match.startsWith('$$')) {
      const selectiveMatch = isSelectiveInlineLatex(match);
      if (!selectiveMatch) return match;
    }

    // Only handle inline math here, not block math
    const isBlockMath = isBlockLatexFragment(match);
    if (isBlockMath) return match; // Let block math be handled separately

    const placeholder = `MATH_PLACEHOLDER_${placeholderCounter++}`;
    placeholderMap.set(
      placeholder,
      <InlineMath
        key={placeholder}
        math={match.startsWith('\\(') ? match.slice(2, -2) : match.slice(1, -1)}
      />
    );
    return placeholder;
  });

  // Process simple variables for markdown
  processedContent = processedContent.replace(
    /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
    '**$1**'
  );

  // Process small LaTeX variables for markdown
  processedContent = processedContent.replace(
    /\\\(([a-zA-Z][a-zA-Z0-9]{0,2})\\\)/g,
    '***$1***'
  );

  // Create a universal children processor for placeholder replacement
  const createChildrenProcessor = () => {
    return (children: any): any => {
      if (typeof children === 'string') {
        let result: (string | JSX.Element)[] = [children];
        placeholderMap.forEach((element, placeholder) => {
          result = result.flatMap((item) => {
            if (typeof item === 'string' && item.includes(placeholder)) {
              const parts = item.split(placeholder);
              const newResult: (string | JSX.Element)[] = [];
              for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                  newResult.push(element);
                }
                if (parts[i]) {
                  newResult.push(parts[i]);
                }
              }
              return newResult;
            }
            return [item];
          });
        });
        return result;
      }
      if (Array.isArray(children)) {
        return children.map(createChildrenProcessor());
      }
      return children;
    };
  };

  // Create custom component to replace placeholders
  const components = {
    // Paragraph elements
    p: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <span {...props}>{processChildren(children)}</span>;
    },

    // Heading elements
    h1: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h1 className="text-3xl font-bold mb-4 mt-6" {...props}>
          {processChildren(children)}
        </h1>
      );
    },
    h2: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h2 className="text-2xl font-semibold mb-3 mt-5" {...props}>
          {processChildren(children)}
        </h2>
      );
    },
    h3: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h3 className="text-xl font-medium mb-2 mt-4" {...props}>
          {processChildren(children)}
        </h3>
      );
    },
    h4: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h4 className="text-lg font-medium mb-2 mt-3" {...props}>
          {processChildren(children)}
        </h4>
      );
    },
    h5: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h5 className="text-base font-medium mb-1 mt-2" {...props}>
          {processChildren(children)}
        </h5>
      );
    },
    h6: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h6 className="text-sm font-medium mb-1 mt-2" {...props}>
          {processChildren(children)}
        </h6>
      );
    },

    // Text formatting elements
    strong: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <strong {...props}>{processChildren(children)}</strong>;
    },
    em: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <em {...props}>{processChildren(children)}</em>;
    },
    code: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <code {...props}>{processChildren(children)}</code>;
    },

    // List elements
    ul: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <ul className="list-disc list-outside space-y-1 my-4 pl-5" {...props}>
          {processChildren(children)}
        </ul>
      );
    },
    ol: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <ol
          className="list-decimal list-outside space-y-1 my-4 pl-5"
          {...props}
        >
          {processChildren(children)}
        </ol>
      );
    },
    li: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <li className="mb-1" {...props}>
          {processChildren(children)}
        </li>
      );
    },

    // Link elements
    a: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <a {...props}>{processChildren(children)}</a>;
    },

    // Block quote elements
    blockquote: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <blockquote {...props}>{processChildren(children)}</blockquote>;
    },

    // Span elements (for inline content)
    span: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <span {...props}>{processChildren(children)}</span>;
    },

    // Div elements
    div: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <div {...props}>{processChildren(children)}</div>;
    },
  };

  return (
    <ReactMarkdown
      key={`text-${index}`}
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

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
 * The algorithm sorts all matches by position, filters nested matches, and renders them in order
 * while preserving the original text structure between special elements.
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
}: {
  content: string;
  renderAsMarkdown?: boolean;
  inline?: boolean;
}) => {
  // Check if content has LaTeX environments or complex structures that need special handling
  const hasComplexStructures = (text: string): boolean => {
    return (
      findTopLevelEnvs(text).length > 0 // Has LaTeX environments
      // Note: Simple headings with inline math can be handled by placeholder approach
      // Only truly complex environments need the complex processing
    );
  };

  // For content with complex structures, use the original processing approach
  if (hasComplexStructures(content) || !renderAsMarkdown) {
    return renderWithComplexProcessing(content, renderAsMarkdown, inline);
  }

  // For simple markdown content with inline math, use placeholder approach
  return renderWithPlaceholders(content, inline);
};

// Original complex processing approach for content with environments, headings, etc.
const renderWithComplexProcessing = (
  content: string,
  renderAsMarkdown: boolean,
  inline: boolean
): JSX.Element => {
  // Process content to handle all types of embedded content
  const processContent = (text: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    const allMatches: Array<{
      start: number;
      end: number;
      content: string;
      type: 'smiles' | 'env' | 'math' | 'heading';
    }> = [];

    // Find SMILES code: <smiles>chemical_structure</smiles>
    const smilesFragments = splitSmiles(text);
    let smilesIndex = 0;
    smilesFragments.forEach((fragment) => {
      const smilesMatch = isSmilesCode(fragment);
      if (smilesMatch) {
        allMatches.push({
          start: smilesIndex,
          end: smilesIndex + fragment.length,
          content: fragment,
          type: 'smiles',
        });
      }
      smilesIndex += fragment.length;
    });

    // Find markdown headings: ###, ##, # at start of line
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    let headingMatch;
    while ((headingMatch = headingPattern.exec(text)) !== null) {
      allMatches.push({
        start: headingMatch.index,
        end: headingMatch.index + headingMatch[0].length,
        content: headingMatch[0],
        type: 'heading',
      });
    }

    // Find LaTeX math expressions
    const mathPattern =
      /(\\\[.*?\\\]|\$\$.*?\$\$|\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
    let mathMatch;
    while ((mathMatch = mathPattern.exec(text)) !== null) {
      // NEW: Skip math that directly follows a markdown list bullet (e.g. "- $x$")
      const prevNewlineIdx = text.lastIndexOf('\n', mathMatch.index - 1);
      const lineStart = prevNewlineIdx === -1 ? 0 : prevNewlineIdx + 1;
      const prefix = text.slice(lineStart, mathMatch.index);
      if (/^\s*[-*+]\s*$/.test(prefix)) {
        continue; // Keep together with list bullet so markdown renders correctly
      }

      // Skip if this is a simple variable (already handled by markdown conversion or inline HTML)
      if (mathMatch[0].startsWith('$') && !mathMatch[0].startsWith('$$')) {
        const simpleVarCheck = isSimpleVariable(mathMatch[0]);
        if (simpleVarCheck) continue;
      }

      // Skip if this is a small variable LaTeX expression (already handled by markdown conversion or inline HTML)
      if (mathMatch[0].startsWith('\\(') && mathMatch[0].endsWith('\\)')) {
        const smallVarCheck = isSmallVariableLatex(mathMatch[0]);
        if (smallVarCheck) continue;
      }

      // Additional filtering for $...$ to ensure it's actually math,
      // to avoid treating regular text with $ as math.
      if (mathMatch[0].startsWith('$') && !mathMatch[0].startsWith('$$')) {
        const selectiveMatch = isSelectiveInlineLatex(mathMatch[0]);
        if (!selectiveMatch) continue;
      }

      allMatches.push({
        start: mathMatch.index,
        end: mathMatch.index + mathMatch[0].length,
        content: mathMatch[0],
        type: 'math',
      });
    }

    // Find top-level LaTeX environments
    const envs = findTopLevelEnvs(text);
    envs.forEach((env) => {
      allMatches.push({ ...env, type: 'env' });
    });

    // Sort and filter matches
    allMatches.sort((a, b) => a.start - b.start);
    const filteredMatches = allMatches.filter((match, i, arr) => {
      const isNested = arr.some((otherMatch, j) => {
        if (i === j) return false;
        return match.start >= otherMatch.start && match.end <= otherMatch.end;
      });
      return !isNested;
    });

    // Process matches
    filteredMatches.forEach((match, index) => {
      // Add text before this match
      if (match.start > currentIndex) {
        const textBefore = text.slice(currentIndex, match.start);
        if (textBefore.trim()) {
          if (renderAsMarkdown) {
            // Use placeholder approach for this text fragment to prevent math from breaking paragraphs
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

      // Render the matched content
      if (match.type === 'smiles') {
        const smilesMatch = isSmilesCode(match.content);
        if (smilesMatch) {
          elements.push(
            <Smiles
              key={`smiles-${index}`}
              code={smilesMatch[1]}
              errorCallback={(error) => console.error(error)}
            />
          );
        }
      } else if (match.type === 'heading') {
        const headingMatch = match.content.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          elements.push(
            <div key={`heading-${index}`}>{renderHeading(text, level)}</div>
          );
        }
      } else if (match.type === 'math' || match.type === 'env') {
        const isBlockMath =
          isBlockLatexFragment(match.content) ||
          isLatexEnvironment(match.content);

        if (isBlockMath) {
          elements.push(
            <div key={`latex-${index}`}>
              {renderLatex(match.content, false)}
            </div>
          );
        } else {
          elements.push(
            <span key={`latex-${index}`}>
              {' '}
              {renderLatex(match.content, true)}{' '}
            </span>
          );
        }
      }

      currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText.trim()) {
        if (renderAsMarkdown) {
          // Use placeholder approach for remaining text
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

    return elements;
  };

  const elements = processContent(content);

  if (inline) {
    return (
      <span className="prose-inline">
        {' '}
        {elements.length > 0 ? (
          elements
        ) : renderAsMarkdown ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.replace(
              /\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g,
              '***$1***'
            )}
          </ReactMarkdown>
        ) : (
          <span className="whitespace-pre-line">
            {processTextWithSmallVariables(content)}
          </span>
        )}
      </span>
    );
  }
  return (
    <div className="prose dark:prose-invert max-w-none">
      {elements.length > 0 ? (
        elements
      ) : renderAsMarkdown ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content
            .replace(/\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g, '**$1**')
            .replace(/\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g, '***$1***')}
        </ReactMarkdown>
      ) : (
        <span className="whitespace-pre-line">
          {processTextWithSmallVariables(content)}
        </span>
      )}
    </div>
  );
};

// Placeholder-based approach for simple markdown with inline math
const renderWithPlaceholders = (
  content: string,
  inline: boolean
): JSX.Element => {
  const placeholderMap = new Map<string, JSX.Element>();
  let placeholderCounter = 0;

  // Find all SMILES and math expressions
  let processedContent = content;

  // Handle SMILES first
  const smilesPattern = /<smiles>(.*?)<\/smiles>/g;
  processedContent = processedContent.replace(
    smilesPattern,
    (match, smilesCode) => {
      const placeholder = `SMILES_PLACEHOLDER_${placeholderCounter++}`;
      placeholderMap.set(
        placeholder,
        <Smiles
          key={placeholder}
          code={smilesCode}
          errorCallback={(error) => console.error(error)}
        />
      );
      return placeholder;
    }
  );

  // Create a universal children processor for placeholder replacement
  const createChildrenProcessor = () => {
    return (children: any): any => {
      if (typeof children === 'string') {
        let result: (string | JSX.Element)[] = [children];
        placeholderMap.forEach((element, placeholder) => {
          result = result.flatMap((item) => {
            if (typeof item === 'string' && item.includes(placeholder)) {
              const parts = item.split(placeholder);
              const newResult: (string | JSX.Element)[] = [];
              for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                  newResult.push(element);
                }
                if (parts[i]) {
                  newResult.push(parts[i]);
                }
              }
              return newResult;
            }
            return [item];
          });
        });
        return result;
      }
      if (Array.isArray(children)) {
        return children.map(createChildrenProcessor());
      }
      return children;
    };
  };

  // Define inline components for processing placeholders
  const inlineComponents = {
    // Paragraph elements
    p: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return inline ? (
        <span {...props}>{processChildren(children)}</span>
      ) : (
        <p {...props}>{processChildren(children)}</p>
      );
    },

    // Heading elements
    h1: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h1 className="text-3xl font-bold mb-4 mt-6" {...props}>
          {processChildren(children)}
        </h1>
      );
    },
    h2: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h2 className="text-2xl font-semibold mb-3 mt-5" {...props}>
          {processChildren(children)}
        </h2>
      );
    },
    h3: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h3 className="text-xl font-medium mb-2 mt-4" {...props}>
          {processChildren(children)}
        </h3>
      );
    },
    h4: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h4 className="text-lg font-medium mb-2 mt-3" {...props}>
          {processChildren(children)}
        </h4>
      );
    },
    h5: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h5 className="text-base font-medium mb-1 mt-2" {...props}>
          {processChildren(children)}
        </h5>
      );
    },
    h6: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <h6 className="text-sm font-medium mb-1 mt-2" {...props}>
          {processChildren(children)}
        </h6>
      );
    },

    // Text formatting elements
    strong: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <strong {...props}>{processChildren(children)}</strong>;
    },
    em: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <em {...props}>{processChildren(children)}</em>;
    },
    code: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <code {...props}>{processChildren(children)}</code>;
    },

    // List elements
    ul: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <ul className="list-disc list-outside space-y-1 my-4 pl-5" {...props}>
          {processChildren(children)}
        </ul>
      );
    },
    ol: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <ol
          className="list-decimal list-outside space-y-1 my-4 pl-5"
          {...props}
        >
          {processChildren(children)}
        </ol>
      );
    },
    li: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return (
        <li className="mb-1" {...props}>
          {processChildren(children)}
        </li>
      );
    },

    // Link elements
    a: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <a {...props}>{processChildren(children)}</a>;
    },

    // Block quote elements
    blockquote: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <blockquote {...props}>{processChildren(children)}</blockquote>;
    },

    // Span elements (for inline content)
    span: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <span {...props}>{processChildren(children)}</span>;
    },

    // Div elements
    div: ({ children, ...props }: any) => {
      const processChildren = createChildrenProcessor();
      return <div {...props}>{processChildren(children)}</div>;
    },
  };

  // Handle math expressions
  const mathPattern =
    /(\\\[.*?\\\]|\$\$.*?\$\$|\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;

  // Separate block math from inline math for proper processing
  const blockMathMatches: Array<{
    match: string;
    index: number;
    length: number;
  }> = [];
  let mathMatch;
  const mathPattern2 = new RegExp(mathPattern.source, mathPattern.flags);

  while ((mathMatch = mathPattern2.exec(processedContent)) !== null) {
    // Skip simple variables
    if (mathMatch[0].startsWith('$') && !mathMatch[0].startsWith('$$')) {
      const simpleVarCheck = isSimpleVariable(mathMatch[0]);
      if (simpleVarCheck) {
        continue;
      }
    }

    // Skip small LaTeX variables
    if (mathMatch[0].startsWith('\\(') && mathMatch[0].endsWith('\\)')) {
      const smallVarCheck = isSmallVariableLatex(mathMatch[0]);
      if (smallVarCheck) {
        continue;
      }
    }

    // Additional filtering for $...$
    if (mathMatch[0].startsWith('$') && !mathMatch[0].startsWith('$$')) {
      const selectiveMatch = isSelectiveInlineLatex(mathMatch[0]);
      if (!selectiveMatch) continue;
    }

    const isBlockMath = isBlockLatexFragment(mathMatch[0]);
    if (isBlockMath) {
      blockMathMatches.push({
        match: mathMatch[0],
        index: mathMatch.index,
        length: mathMatch[0].length,
      });
    }
  }

  // If we have block math, we need to split content and handle it specially
  if (blockMathMatches.length > 0) {
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    blockMathMatches.forEach((blockMath, index) => {
      // Process content before this block math
      if (blockMath.index > lastIndex) {
        const beforeContent = processedContent.slice(
          lastIndex,
          blockMath.index
        );
        if (beforeContent.trim()) {
          // Process inline math in this segment
          let processedBefore = beforeContent;
          processedBefore = processedBefore.replace(mathPattern, (match) => {
            // Skip simple variables
            if (match.startsWith('$') && !match.startsWith('$$')) {
              const simpleVarCheck = isSimpleVariable(match);
              if (simpleVarCheck) {
                return match;
              }
            }

            // Skip small LaTeX variables
            if (match.startsWith('\\(') && match.endsWith('\\)')) {
              const smallVarCheck = isSmallVariableLatex(match);
              if (smallVarCheck) {
                return match;
              }
            }

            // Additional filtering for $...$
            if (match.startsWith('$') && !match.startsWith('$$')) {
              const selectiveMatch = isSelectiveInlineLatex(match);
              if (!selectiveMatch) return match;
            }

            // Only process inline math here
            const isBlockMath = isBlockLatexFragment(match);
            if (isBlockMath) return match;

            const placeholder = `MATH_PLACEHOLDER_${placeholderCounter++}`;
            placeholderMap.set(
              placeholder,
              <span key={placeholder}>{renderLatex(match, true)}</span>
            );
            return placeholder;
          });

          // Process simple variables for markdown
          processedBefore = processedBefore.replace(
            /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
            '**$1**'
          ); // Process small LaTeX variables for markdown
          processedBefore = processedBefore.replace(
            /\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g,
            '***$1***'
          );

          elements.push(
            <ReactMarkdown
              key={`before-${index}`}
              remarkPlugins={[remarkGfm]}
              components={inlineComponents}
            >
              {processedBefore}
            </ReactMarkdown>
          );
        }
      }

      // Add the block math
      elements.push(
        <div key={`block-math-${index}`}>
          {renderLatex(blockMath.match, false)}
        </div>
      );

      lastIndex = blockMath.index + blockMath.length;
    });

    // Process remaining content after last block math
    if (lastIndex < processedContent.length) {
      const afterContent = processedContent.slice(lastIndex);
      if (afterContent.trim()) {
        // Process inline math in remaining content
        let processedAfter = afterContent;
        processedAfter = processedAfter.replace(mathPattern, (match) => {
          // Skip simple variables
          if (match.startsWith('$') && !match.startsWith('$$')) {
            const simpleVarCheck = isSimpleVariable(match);
            if (simpleVarCheck) {
              return match;
            }
          }

          // Skip small LaTeX variables
          if (match.startsWith('\\(') && match.endsWith('\\)')) {
            const smallVarCheck = isSmallVariableLatex(match);
            if (smallVarCheck) {
              return match;
            }
          }

          // Additional filtering for $...$
          if (match.startsWith('$') && !match.startsWith('$$')) {
            const selectiveMatch = isSelectiveInlineLatex(match);
            if (!selectiveMatch) return match;
          }

          // Only process inline math here
          const isBlockMath = isBlockLatexFragment(match);
          if (isBlockMath) return match;

          const placeholder = `MATH_PLACEHOLDER_${placeholderCounter++}`;
          placeholderMap.set(
            placeholder,
            <span key={placeholder}>{renderLatex(match, true)}</span>
          );
          return placeholder;
        });

        // Process simple variables for markdown
        processedAfter = processedAfter.replace(
          /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
          '**$1**'
        ); // Process small LaTeX variables for markdown
        processedAfter = processedAfter.replace(
          /\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g,
          '***$1***'
        );

        elements.push(
          <ReactMarkdown
            key="after-last"
            remarkPlugins={[remarkGfm]}
            components={inlineComponents}
          >
            {processedAfter}
          </ReactMarkdown>
        );
      }
    }

    if (inline) {
      return <span className="prose-inline">{elements}</span>;
    }

    return <div className="prose dark:prose-invert max-w-none">{elements}</div>;
  }
  // Original inline-only processing when no block math is present
  processedContent = processedContent.replace(mathPattern, (match) => {
    // Skip simple variables
    if (match.startsWith('$') && !match.startsWith('$$')) {
      const simpleVarCheck = isSimpleVariable(match);
      if (simpleVarCheck) {
        return match; // Keep as is, will be processed by markdown
      }
    }

    // Skip small LaTeX variables
    if (match.startsWith('\\(') && match.endsWith('\\)')) {
      const smallVarCheck = isSmallVariableLatex(match);
      if (smallVarCheck) {
        return match; // Keep as is, will be processed by markdown
      }
    }

    // Additional filtering for $...$
    if (match.startsWith('$') && !match.startsWith('$$')) {
      const selectiveMatch = isSelectiveInlineLatex(match);
      if (!selectiveMatch) return match;
    }

    const placeholder = `MATH_PLACEHOLDER_${placeholderCounter++}`;
    placeholderMap.set(
      placeholder,
      <span key={placeholder}>{renderLatex(match, true)}</span>
    );
    return placeholder;
  });
  // Process simple variables for markdown
  processedContent = processedContent.replace(
    /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
    '**$1**'
  );

  // Process small LaTeX variables for markdown
  processedContent = processedContent.replace(
    /\\\(\s*([a-zA-Z][a-zA-Z0-9]{0,2})\s*\\\)/g,
    '***$1***'
  );

  if (inline) {
    return (
      <span className="prose-inline">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={inlineComponents}
        >
          {processedContent}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
