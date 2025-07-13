declare module "react-katex" {
  import { ComponentType } from "react";

  export interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: any;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    allowedProtocols?: string[];
    strict?: boolean;
    trust?: boolean;
    fleqn?: boolean;
    leqno?: boolean;
    output?: string;
  }

  export interface InlineMathProps {
    children?: string;
    math?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: KatexOptions;
  }

  export interface BlockMathProps {
    children?: string;
    math?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: KatexOptions;
  }

  export const InlineMath: ComponentType<InlineMathProps>;
  export const BlockMath: ComponentType<BlockMathProps>;
}

declare module "smiles-drawer" {
  export interface SmilesDrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    bondLength?: number;
    shortBondLength?: number;
    bondSpacing?: number;
    atomVisualization?: string;
    isomeric?: boolean;
    debug?: boolean;
    terminalCarbons?: boolean;
    explicitHydrogens?: boolean;
    overlapSensitivity?: number;
    overlapResolutionIterations?: number;
    compactDrawing?: boolean;
    fontSizeLarge?: number;
    fontSizeSmall?: number;
    padding?: number;
    experimental?: boolean;
    themes?: any;
  }

  export class SvgDrawer {
    constructor(options?: SmilesDrawerOptions);
    draw(tree: any, target: SVGElement | string, theme?: string): void;
  }

  export function parse(
    smiles: string,
    successCallback: (tree: any) => void,
    errorCallback?: (error: any) => void
  ): void;

  // Other exports from the library
  export class Drawer {
    constructor(options?: SmilesDrawerOptions);
  }

  export class ReactionDrawer {
    constructor(options?: SmilesDrawerOptions);
  }

  export class ReactionParser {
    constructor();
  }

  export class GaussDrawer {
    constructor(options?: SmilesDrawerOptions);
  }

  export class SmiDrawer {
    constructor(options?: SmilesDrawerOptions);
  }

  export const Parser: {
    SyntaxError: any;
    parse: (smiles: string) => any;
  };

  export function clean(smiles: string): string;
  export function apply(smiles: string, options?: any): any;
  export function parseReaction(reaction: string): any;

  export const Version: string;
}
