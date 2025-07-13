<div align="center">

# React SciText

[![npm version](https://badge.fury.io/js/react-scitext.svg)](https://badge.fury.io/js/react-scitext)
[![Build Status](https://github.com/rsmyst/react-scitext/workflows/CI/badge.svg)](https://github.com/rsmyst/react-scitext/actions)
[![Coverage Status](https://coveralls.io/repos/github/rsmyst/react-scitext/badge.svg?branch=main)](https://coveralls.io/github/rsmyst/react-scitext?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-scitext)](https://bundlephobia.com/package/react-scitext)

**A powerful React component library for rendering scientific text with mixed content including Markdown, LaTeX math, and SMILES chemical structures.**

[Documentation](https://rsmyst.github.io/react-scitext) • [Storybook](https://react-scitext.netlify.app) • [Examples](#examples) • [Getting Started](#installation)

</div>

---

## Features

- **Unified Content Rendering** - Single component handles mixed content types intelligently
- **Smart Math Detection** - Avoids false positives in LaTeX math rendering with intelligent parsing
- **Chemical Structure Support** - Built-in SMILES notation rendering with validation
- **Full Markdown Support** - GitHub Flavored Markdown with syntax highlighting
- **Advanced LaTeX** - Support for environments, equations, lists, and complex structures
- **Security First** - Input validation, sanitization, and XSS prevention
- **Performance Optimized** - Efficient parsing algorithms with minimal re-renders
- **TypeScript Ready** - Comprehensive type definitions and intellisense
- **Accessibility** - ARIA labels and screen reader support
- **Responsive** - Works seamlessly across devices and screen sizes

## Installation

```bash
npm install react-scitext
```

**Peer Dependencies:**

```bash
npm install react react-dom
```

**Required CSS for LaTeX rendering:**

```bash
npm install katex
```

## Quick Start

```tsx
import { RichText } from "react-scitext";
import "katex/dist/katex.min.css"; // Required for LaTeX rendering

function App() {
  const content = `
# Scientific Content Example

Mix **markdown** with math $E = mc^2$ and chemistry:

<smiles>c1ccccc1</smiles>

$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

\\begin{itemize}
\\item First item with $\\alpha$
\\item Second item with $\\beta$
\\end{itemize}
`;

  return <RichText content={content} />;
}
```

## Content Formatting Guidelines

### Markdown Formatting

The component supports GitHub Flavored Markdown with the following formatting guidelines:

#### Headers

Use standard markdown header syntax with proper spacing:

```markdown
# Main Title

## Section Header

### Subsection Header

#### Sub-subsection Header
```

#### Text Formatting

```markdown
**Bold text** for emphasis
_Italic text_ for subtle emphasis
**_Bold and italic_** for strong emphasis
`inline code` for code snippets
~~Strikethrough~~ for deleted text
```

#### Lists

Use consistent spacing and indentation:

```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item 2.1
  - Nested item 2.2

1. Ordered list item 1
2. Ordered list item 2
   1. Nested numbered item 2.1
   2. Nested numbered item 2.2
```

#### Code Blocks

Use triple backticks with language specification:

````markdown
```javascript
function example() {
  return "Hello World";
}
```
````

### LaTeX Math Formatting

The component supports multiple LaTeX delimiter styles with intelligent detection:

#### Inline Math

For mathematical expressions within text:

```latex
$E = mc^2$                    # Simple expressions
$\frac{a}{b}$                # Fractions
$\alpha + \beta$             # Greek letters
$x^2 + y^2 = z^2$           # Equations
$\sum_{i=1}^{n} x_i$        # Summations
```

#### Alternative Inline Delimiters

```latex
\(E = mc^2\)                 # Parentheses style
```

#### Block Math

For standalone mathematical expressions:

```latex
$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

# Or using bracket style:
\[
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
\]
```

#### Complex Equations

```latex
$$
\begin{align}
f(x) &= ax^2 + bx + c \\
f'(x) &= 2ax + b \\
f''(x) &= 2a
\end{align}
$$
```

#### Matrices

```latex
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

### LaTeX Environment Formatting

The component supports structured LaTeX environments with proper syntax:

#### Lists

```latex
\begin{itemize}
\item First item
\item Second item with math $x^2$
\item Third item
\end{itemize}

\begin{enumerate}
\item Numbered item 1
\item Numbered item 2
\end{enumerate}
```

#### Description Lists

```latex
\begin{description}
\item[Term 1] Description of term 1
\item[Term 2] Description of term 2
\end{description}
```

#### Equations

```latex
\begin{equation}
E = mc^2
\end{equation}

\begin{equation}
\label{eq:quadratic}
x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}
\end{equation}
```

### SMILES Chemical Structure Formatting

Chemical structures use SMILES notation within HTML-like tags:

#### Basic Molecules

```html
<smiles>C</smiles>
<!-- Methane -->
<smiles>O</smiles>
<!-- Water -->
<smiles>CC</smiles>
<!-- Ethane -->
<smiles>CCO</smiles>
<!-- Ethanol -->
```

#### Aromatic Compounds

```html
<smiles>c1ccccc1</smiles>
<!-- Benzene -->
<smiles>c1ccc2ccccc2c1</smiles>
<!-- Naphthalene -->
<smiles>c1ccc(cc1)O</smiles>
<!-- Phenol -->
```

#### Complex Molecules

```html
<!-- Caffeine -->
<smiles>CN1C=NC2=C1C(=O)N(C(=O)N2C)C</smiles>

<!-- Aspirin -->
<smiles>CC(=O)OC1=CC=CC=C1C(=O)O</smiles>

<!-- Glucose -->
<smiles>C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O</smiles>
```

#### Formatting Guidelines for SMILES

- Use lowercase letters for aromatic atoms: `c1ccccc1` for benzene
- Use uppercase letters for aliphatic atoms: `CCCC` for butane
- Include stereochemistry when relevant: `[C@@H]` for chiral centers
- Use proper ring closure numbers: `c1ccccc1` not `c1cccc1`
- Validate SMILES strings before use with online tools or the built-in validator

### Mixed Content Best Practices

When combining different content types, follow these guidelines:

#### Spacing and Separation

```markdown
# Title

Regular text with **markdown** formatting.

Mathematical expression: $E = mc^2$

Chemical structure:
<smiles>c1ccccc1</smiles>

Block equation:
$$\int_{0}^{1} x^2 dx = \frac{1}{3}$$

\begin{itemize}
\item List item with math $\alpha$
\item List item with chemistry: <smiles>CCO</smiles>
\end{itemize}
```

#### Escaping Special Characters

When you need to display literal characters that have special meaning:

```markdown
Use \$ for literal dollar signs
Use \\ for literal backslashes
Use \< and \> for literal angle brackets
```

#### Variable Detection

The component intelligently distinguishes between simple variables and complex math:

```latex
# Rendered as bold italics (simple variables):
$x$, $y$, $z$, $F_m$, $k_1$

# Rendered as LaTeX math (complex expressions):
$x^2 + y^2 = z^2$
$\frac{a}{b}$
$\{a, b, c\}$
$\alpha + \beta$
```

#### Content Organization

For optimal rendering, organize content in this order:

1. Headers and titles
2. Explanatory text with inline math
3. Chemical structures
4. Block equations
5. Lists and structured content

## Examples

### Basic Usage

```tsx
import { RichText } from 'react-scitext';

// Simple text with inline math
<RichText content="The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$" />

// Block math equations
<RichText content="$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$" />

// Chemical structures
<RichText content="Caffeine structure: <smiles>CN1C=NC2=C1C(=O)N(C(=O)N2C)C</smiles>" />
```

### Advanced Usage

```tsx
import { RichText, Smiles } from "react-scitext";

// Complex mixed content
const scientificContent = `
# Research Results

## Chemical Analysis

The compound **caffeine** has the structure:
<smiles>CN1C=NC2=C1C(=O)N(C(=O)N2C)C</smiles>

## Mathematical Model

The reaction rate follows the equation:

$$k = A \\cdot e^{-\\frac{E_a}{RT}}$$

Where:
- $k$ = rate constant
- $A$ = pre-exponential factor
- $E_a$ = activation energy
- $R$ = gas constant
- $T$ = temperature

\\begin{enumerate}
\\item First observation with $\\alpha = 0.05$
\\item Second observation with $\\beta = 0.95$
\\end{enumerate}
`;

function ResearchPaper() {
  return (
    <div className="research-paper">
      <RichText content={scientificContent} />
    </div>
  );
}
```

### Inline Rendering

```tsx
// Inline math without prose wrapper
<RichText
  content="The value of $\\pi$ is approximately 3.14159"
  inline={true}
/>

// Disable markdown processing
<RichText
  content="Raw text with $variables$ but no formatting"
  renderAsMarkdown={false}
/>
```

### Error Handling

```tsx
import { Smiles } from "react-scitext";

function ChemicalStructure() {
  const handleError = (error: unknown) => {
    console.error("SMILES rendering failed:", error);
    // Custom error handling (e.g., fallback UI, logging)
  };

  return <Smiles code="c1ccccc1" errorCallback={handleError} />;
}
```

## API Reference

### RichText Component

The main component for rendering mixed scientific content.

```tsx
interface RichTextProps {
  content: string;
  renderAsMarkdown?: boolean;
  inline?: boolean;
}
```

| Prop               | Type      | Default | Description                                      |
| ------------------ | --------- | ------- | ------------------------------------------------ |
| `content`          | `string`  | -       | The content string to render                     |
| `renderAsMarkdown` | `boolean` | `true`  | Whether to process non-LaTeX content as Markdown |
| `inline`           | `boolean` | `false` | Whether to render inline without prose wrapper   |

#### Examples

```tsx
// Basic usage
<RichText content="Hello **world** with $x^2$!" />

// Inline rendering
<RichText content="Inline $E = mc^2$" inline={true} />

// Plain text mode
<RichText content="No markdown processing" renderAsMarkdown={false} />
```

### Smiles Component

Dedicated component for chemical structure rendering.

```tsx
interface SmilesProps {
  code: string;
  errorCallback: (error: unknown) => void;
}
```

| Prop            | Type                       | Description                          |
| --------------- | -------------------------- | ------------------------------------ |
| `code`          | `string`                   | Valid SMILES notation string         |
| `errorCallback` | `(error: unknown) => void` | Function called when rendering fails |

#### Examples

```tsx
// Basic chemical structure
<Smiles
  code="CCO"
  errorCallback={(err) => console.error(err)}
/>

// Complex molecule
<Smiles
  code="CC(=O)OC1=CC=CC=C1C(=O)O"
  errorCallback={handleError}
/>
```

### Utility Functions

Advanced utility functions for custom implementations:

```tsx
import {
  // LaTeX utilities
  splitLatex,
  isInlineLatexFragment,
  isBlockLatexFragment,
  validateLatexInput,
  sanitizeLatexContent,

  // SMILES utilities
  validateSmilesCode,
  sanitizeSmilesCode,
  extractSmilesCode,

  // Markdown utilities
  validateMarkdownContent,
  sanitizeMarkdownContent,
  processMixedContent,
} from "react-scitext";

// Example usage
const isValidSmiles = validateSmilesCode(userInput);
const latexParts = splitLatex(text);
const isInline = isInlineLatexFragment(expression);
```

## Smart Content Detection

The library intelligently distinguishes between different content types:

```tsx
// Mathematical expressions (rendered as LaTeX)
$x^2 + y^2 = z^2$     // Complex expression
$\frac{a}{b}$         // Fractions
$\{a, b, c\}$         // Sets
$\alpha + \beta$      // Greek letters

// Simple variables (rendered as bold italics)
$x$, $y$, $z$         // Single letters
$F_m$, $k_1$          // With subscripts

// Not treated as math (avoids false positives)
"Price is $10"        // Dollar amounts
"user$variable"       // Variable names
```

## Security Features

Built-in security measures for safe rendering:

- **Input Validation**: All content types are validated before rendering
- **Content Sanitization**: Potentially dangerous content is sanitized
- **XSS Prevention**: Protection against cross-site scripting attacks
- **Size Limits**: Prevents DoS attacks through content size limits
- **Safe Rendering**: Uses safe rendering methods for all content types

## Performance

Optimized for handling large documents with mixed content:

- **Efficient Parsing**: Optimized algorithms for content detection
- **Minimal Re-renders**: React optimization prevents unnecessary updates
- **Memory Efficient**: Optimized memory usage for large documents
- **Bundle Size**: Minimal impact on your application bundle

## Development

### Building from Source

```bash
git clone https://github.com/rsmyst/react-scitext.git
cd react-scitext
npm install
npm run build
```

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run test:coverage # Run with coverage report
npm run storybook     # Start Storybook
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Storybook

Explore components and examples:

```bash
npm run storybook          # Start Storybook dev server
```

## Troubleshooting

### Common Issues

**LaTeX not rendering:**

- Ensure `katex/dist/katex.min.css` is imported
- Check that LaTeX syntax is valid
- Verify content is properly escaped

**SMILES structures not displaying:**

- Validate SMILES notation using `validateSmilesCode`
- Check browser console for errors
- Ensure error callback is properly implemented

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

## License

This project is licensed under a custom license that allows free use for non-commercial purposes including personal, educational, and research use. Commercial use requires explicit permission from the copyright holder.

**For Non-Commercial Use:**

- ✅ Personal projects
- ✅ Educational purposes
- ✅ Research projects
- ✅ Open source contributions
- ✅ Modifications and improvements

**For Commercial Use:**

- ❌ Requires explicit written permission
- 📧 Contact for commercial licensing

See the [LICENSE](LICENSE) file for complete details.

## Acknowledgments

- [KaTeX](https://katex.org/) for LaTeX math rendering
- [react-markdown](https://github.com/remarkjs/react-markdown) for Markdown processing
- [smiles-drawer](https://github.com/reymond-group/smilesDrawer) for chemical structure rendering
- [Storybook](https://storybook.js.org/) for component documentation

## Changelog

### 1.0.0 (Latest)

- Initial release
- Unified content rendering system
- LaTeX math support with smart detection
- SMILES chemical structure support
- GitHub Flavored Markdown support
- Security features and input validation
- Performance optimizations
- Comprehensive TypeScript support
- Complete test suite and documentation
- Storybook integration with examples

---

<div align="center">

**Made with ❤️ for the scientific community**

[Star us on GitHub](https://github.com/rsmyst/react-scitext) • [View on npm](https://www.npmjs.com/package/react-scitext) • [Report Issues](https://github.com/rsmyst/react-scitext/issues)

</div>
