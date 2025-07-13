// Core types for the AI text renderer package

export type LatexEnv = {
  start: number;
  end: number;
  content: string;
};

export type ContentMatch = {
  start: number;
  end: number;
  content: string;
  type: 'smiles' | 'env' | 'math' | 'heading';
};

export type RichTextProps = {
  content: string;
  renderAsMarkdown?: boolean;
  inline?: boolean;
};

export type SmilesProps = {
  code: string;
  errorCallback: (error: unknown) => void;
};

export type ProcessingOptions = {
  renderAsMarkdown: boolean;
  inline: boolean;
};

export type MathFragment = {
  content: string;
  isBlock: boolean;
  isInline: boolean;
  isSelectiveInline: boolean;
};

export type VariableMatch = {
  match: RegExpMatchArray;
  content: string;
};