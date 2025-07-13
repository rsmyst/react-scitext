import type { Meta, StoryObj } from "@storybook/react";
import { RichText } from "../src/components/RichText";

const meta = {
  component: RichText,
  title: "React SciText/RichText",
  parameters: {
    docs: {
      description: {
        component:
          "A React component for rendering scientific text with Markdown, LaTeX, and SMILES support",
      },
    },
  },
  args: {
    renderAsMarkdown: true,
    inline: false,
  },
  argTypes: {
    content: {
      control: "text",
      description: "The content to render",
    },
    renderAsMarkdown: {
      control: "boolean",
      description: "Whether to render non-LaTeX content as Markdown",
    },
    inline: {
      control: "boolean",
      description: "Whether to render inline without prose wrapper",
    },
  },
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const SimpleText: Story = {
  args: {
    content: "This is plain text without any special formatting.",
  },
  parameters: {
    docs: {
      description: {
        story: "Basic plain text rendering",
      },
    },
  },
};

export const TextWithLatex: Story = {
  args: {
    content: "What is $2 + 2$?",
  },
  parameters: {
    docs: {
      description: {
        story: "Simple inline LaTeX math rendering",
      },
    },
  },
};

export const TextWithSmiles: Story = {
  args: {
    content: "Benzene has 6 carbon atoms in a ring: <smiles>c1ccccc1</smiles>",
  },
  parameters: {
    docs: {
      description: {
        story: "Chemical structure rendering with SMILES notation",
      },
    },
  },
};

// Markdown Examples
export const MarkdownBasics: Story = {
  args: {
    content: `# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold text** and *italic text*.

- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

\`inline code\` and a [link](https://example.com).`,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic Markdown formatting features",
      },
    },
  },
};

export const MarkdownWithCode: Story = {
  args: {
    content: `Here's some code:

\`\`\`javascript
function quadraticFormula(a, b, c) {
  const discriminant = b * b - 4 * a * c;
  return [
    (-b + Math.sqrt(discriminant)) / (2 * a),
    (-b - Math.sqrt(discriminant)) / (2 * a)
  ];
}
\`\`\`

The discriminant determines the nature of the roots.`,
  },
  parameters: {
    docs: {
      description: {
        story: "Code blocks with syntax highlighting",
      },
    },
  },
};

// LaTeX Math Examples
export const InlineLatexMath: Story = {
  args: {
    content: `The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

Einstein's famous equation is $E = mc^2$.

The area of a circle is $A = \\pi r^2$ where $r$ is the radius.`,
  },
  parameters: {
    docs: {
      description: {
        story: "Inline LaTeX math expressions",
      },
    },
  },
};

export const BlockLatexMath: Story = {
  args: {
    content: `The quadratic formula:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Euler's identity:

$$e^{i\\pi} + 1 = 0$$

The Schrödinger equation:

$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$`,
  },
  parameters: {
    docs: {
      description: {
        story: "Block LaTeX math expressions using $$ delimiters",
      },
    },
  },
};

export const BlockLatexMathBrackets: Story = {
  args: {
    content: `The quadratic formula:

\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]

Euler's identity:

\\[e^{i\\pi} + 1 = 0\\]

The Schrödinger equation:

\\[i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi\\]`,
  },
  parameters: {
    docs: {
      description: {
        story: "Block LaTeX math expressions using \\[...\\] delimiters",
      },
    },
  },
};

export const MixedLatexDelimiters: Story = {
  args: {
    content: `Different LaTeX delimiters:

Inline with dollar signs: $x^2 + y^2 = z^2$

Inline with parentheses: \\(a^2 + b^2 = c^2\\)

Block with double dollars:
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
`,
  },
  parameters: {
    docs: {
      description: {
        story: "Different LaTeX delimiter styles",
      },
    },
  },
};

// Complex Examples
export const ComplexMathExamples: Story = {
  args: {
    content: `## Physics Formulas

**Newton's Second Law**: $F = ma$

**Kinetic Energy**: $KE = \\frac{1}{2}mv^2$

**Gravitational Force**: 
$$F = G\\frac{m_1 m_2}{r^2}$$

**Wave Equation**:
$$\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\frac{\\partial^2 u}{\\partial x^2}$$

## Chemistry

**Ideal Gas Law**: $PV = nRT$

**pH Calculation**: $pH = -\\log[H^+]$

Benzene structure: <smiles>c1ccccc1</smiles>`,
  },
  parameters: {
    docs: {
      description: {
        story: "Complex mixed content with math and chemistry",
      },
    },
  },
};

// LaTeX Environments
export const LatexEnvironments: Story = {
  args: {
    content: `# LaTeX List Environments

## Itemize Environment
\\begin{itemize}
\\item First item
\\item Second item with $x^2$
\\item Third item
\\end{itemize}

## Enumerate Environment
\\begin{enumerate}
\\item First numbered item
\\item Second numbered item
\\item Third numbered item
\\end{enumerate}

## Description Environment
\\begin{description}
\\item[Term 1] Description of first term
\\item[Term 2] Description of second term with $\\alpha + \\beta$
\\item[Term 3] Description of third term
\\end{description}`,
  },
  parameters: {
    docs: {
      description: {
        story: "LaTeX list environments (itemize, enumerate, description)",
      },
    },
  },
};

export const MarkdownWithLatexAndSmiles: Story = {
  args: {
    content: `# Organic Chemistry: Aromatic Compounds

## Benzene Properties

Benzene ($C_6H_6$) is the simplest aromatic hydrocarbon.

**Structure**: <smiles>c1ccccc1</smiles>

### Key Characteristics:

1. **Molecular Formula**: $C_6H_6$
2. **Molar Mass**: $78.11 \\text{ g/mol}$
3. **Resonance Energy**: $\\Delta H = -36 \\text{ kcal/mol}$

### Hückel's Rule

For a molecule to be aromatic, it must have:
- $(4n + 2)\\pi$ electrons where $n$ is a non-negative integer
- For benzene: $n = 1$, so $4(1) + 2 = 6\\pi$ electrons

**Related Compounds**:
- Toluene: <smiles>Cc1ccccc1</smiles>
- Naphthalene: <smiles>c1ccc2ccccc2c1</smiles>

The energy diagram shows:
$$E = E_0 + 2\\alpha + 2\\beta\\cos\\left(\\frac{2\\pi k}{6}\\right)$$`,
  },
  parameters: {
    docs: {
      description: {
        story: "Complete example with Markdown, LaTeX, and SMILES",
      },
    },
  },
};

// Edge Cases and Error Testing
export const SmartVariableDetection: Story = {
  args: {
    content: `# Smart Variable Detection

Simple variables are styled as bold: $x$, $y$, $z$

Complex math stays as LaTeX: $x^2 + y^2 = z^2$

Sets and functions: $f(x) = \\{a, b, c\\}$ and $g(x) = \\sin(x)$

Chemical formulas: $H_2O$, $CO_2$, $C_6H_6$

Avoid false positives: price is $10 and variable_name is not math.`,
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates smart variable detection to avoid false positives",
      },
    },
  },
};

export const InlineMode: Story = {
  args: {
    content:
      "Inline math $E = mc^2$ and chemistry <smiles>C</smiles> rendering",
    inline: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Inline rendering mode without prose wrapper",
      },
    },
  },
};

export const ErrorHandling: Story = {
  args: {
    content: `# Error Handling Examples

Invalid SMILES: <smiles>invalid&smiles</smiles>

Malformed LaTeX environment:
\\begin{itemize}
\\item Missing end tag

Complex nested structures should still work.`,
  },
  parameters: {
    docs: {
      description: {
        story: "Error handling for invalid content",
      },
    },
  },
};

export const PerformanceTest: Story = {
  args: {
    content: `# Large Content Performance Test

${Array.from(
  { length: 25 },
  (_, i) => `
## Section ${i + 1}

This is paragraph ${i + 1} with math $x_{${i}} = \\frac{${i}}{${
    i + 1
  }}$ and chemistry <smiles>${"C".repeat(Math.min(i + 1, 10))}</smiles>.

\\begin{itemize}
\\item Item 1 in section ${i + 1}
\\item Item 2 with formula $y_{${i}} = ${i}^2$
\\item Item 3 with structure <smiles>c1ccccc1</smiles>
\\end{itemize}
`
).join("")}`,
  },
  parameters: {
    docs: {
      description: {
        story: "Performance test with large amount of mixed content",
      },
    },
  },
};
