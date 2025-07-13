import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineMath } from "react-katex";
import { Smiles } from "../../Smiles";
import {
  isSelectiveInlineLatex,
  isSimpleVariable,
  isSmallVariableLatex,
} from "../../../utils";

// Process a text fragment with placeholders for inline math
export function processTextFragmentWithPlaceholders(
  textFragment: string,
  index: number
): JSX.Element {
  const placeholderMap = new Map<string, JSX.Element>();
  let placeholderCounter = 0;
  let processedContent = textFragment;

  // Handle SMILES first
  const smilesPattern = /<smiles>(.*?)<\/smiles>/g;
  processedContent = processedContent.replace(
    smilesPattern,
    (_, smilesCode) => {
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
        math={match.startsWith("\\(") ? match.slice(2, -2) : match.slice(1, -1)}
      />
    );
    return placeholder;
  });

  // Process simple variables for markdown
  processedContent = processedContent.replace(
    /\$([a-zA-Z][a-zA-Z0-9_]{0,2})\$/g,
    "**$1**"
  );

  // Process small LaTeX variables for markdown
  processedContent = processedContent.replace(
    /\\\(([a-zA-Z][a-zA-Z0-9]{0,2})\\\)/g,
    "***$1***"
  );

  // Create a universal children processor for placeholder replacement
  const createChildrenProcessor = () => {
    return (children: any): any => {
      if (typeof children === "string") {
        let result: (string | JSX.Element)[] = [children];
        placeholderMap.forEach((element, placeholder) => {
          result = result.flatMap((item) => {
            if (typeof item === "string" && item.includes(placeholder)) {
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
      return <p {...props}>{processChildren(children)}</p>;
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
}
