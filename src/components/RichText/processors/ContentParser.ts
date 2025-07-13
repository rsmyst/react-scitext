import type { ContentMatch } from "../../../types";
import {
  findTopLevelEnvs,
  isSelectiveInlineLatex,
  isSimpleVariable,
  isSmallVariableLatex,
} from "../../../utils";

export class ContentParser {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  // Find all content matches (SMILES, math, environments, headings)
  public parseContent(): ContentMatch[] {
    const allMatches: ContentMatch[] = [];

    // Find SMILES code
    this.findSmilesMatches(allMatches);

    // Find markdown headings
    this.findHeadingMatches(allMatches);

    // Find LaTeX math expressions
    this.findMathMatches(allMatches);

    // Find top-level LaTeX environments
    this.findEnvironmentMatches(allMatches);

    // Sort and filter matches
    return this.filterNestedMatches(allMatches);
  }

  private findSmilesMatches(matches: ContentMatch[]): void {
    const smilesPattern = /<smiles>.*?<\/smiles>/gs;
    let smilesMatch;

    while ((smilesMatch = smilesPattern.exec(this.text)) !== null) {
      matches.push({
        start: smilesMatch.index,
        end: smilesMatch.index + smilesMatch[0].length,
        content: smilesMatch[0],
        type: "smiles",
      });
    }
  }

  private findHeadingMatches(matches: ContentMatch[]): void {
    const headingPattern = /^(#{1,6})\s+(.+)$/gm;
    let headingMatch;

    while ((headingMatch = headingPattern.exec(this.text)) !== null) {
      matches.push({
        start: headingMatch.index,
        end: headingMatch.index + headingMatch[0].length,
        content: headingMatch[0],
        type: "heading",
      });
    }
  }

  private findMathMatches(matches: ContentMatch[]): void {
    // Find block math first ($$...$$ and \[...\])
    const blockPattern = /(\$\$.*?\$\$|\\\[.*?\\\])/gs;
    let blockMatch;

    while ((blockMatch = blockPattern.exec(this.text)) !== null) {
      matches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        content: blockMatch[0],
        type: "math",
      });
    }

    // Find inline math (\(...\) and selective $...$)
    const inlinePattern = /(\\\(.*?\\\)|\$[^$\s][^$]*[^$\s]\$|\$[^$\s]+\$)/gs;
    let inlineMatch: RegExpExecArray | null;

    while ((inlineMatch = inlinePattern.exec(this.text)) !== null) {
      // Skip if this overlaps with existing matches (block math takes precedence)
      const overlaps = matches.some(
        (existing) =>
          inlineMatch!.index < existing.end &&
          inlineMatch!.index + inlineMatch![0].length > existing.start
      );

      if (overlaps) {
        continue;
      }

      // Skip math that directly follows a markdown list bullet
      if (this.isInListContext(inlineMatch!.index)) {
        continue;
      }

      // Skip simple variables and small LaTeX variables
      if (this.shouldSkipMathFragment(inlineMatch![0])) {
        continue;
      }

      matches.push({
        start: inlineMatch!.index,
        end: inlineMatch!.index + inlineMatch![0].length,
        content: inlineMatch![0],
        type: "math",
      });
    }
  }

  private findEnvironmentMatches(matches: ContentMatch[]): void {
    const envs = findTopLevelEnvs(this.text);
    envs.forEach((env) => {
      matches.push({ ...env, type: "env" });
    });
  }

  private isInListContext(index: number): boolean {
    const prevNewlineIdx = this.text.lastIndexOf("\n", index - 1);
    const lineStart = prevNewlineIdx === -1 ? 0 : prevNewlineIdx + 1;
    const prefix = this.text.slice(lineStart, index);
    return /^\s*[-*+]\s*$/.test(prefix);
  }

  private shouldSkipMathFragment(fragment: string): boolean {
    // Skip simple variables
    if (fragment.startsWith("$") && !fragment.startsWith("$$")) {
      const simpleVarCheck = isSimpleVariable(fragment);
      if (simpleVarCheck) return true;
    }

    // Skip small LaTeX variables
    if (fragment.startsWith("\\(") && fragment.endsWith("\\)")) {
      const smallVarCheck = isSmallVariableLatex(fragment);
      if (smallVarCheck) return true;
    }

    // Additional filtering for $...$
    if (fragment.startsWith("$") && !fragment.startsWith("$$")) {
      const selectiveMatch = isSelectiveInlineLatex(fragment);
      if (!selectiveMatch) return true;
    }

    return false;
  }

  private filterNestedMatches(matches: ContentMatch[]): ContentMatch[] {
    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Filter out nested matches
    return matches.filter((match, i, arr) => {
      const isNested = arr.some((otherMatch, j) => {
        if (i === j) return false;
        return match.start >= otherMatch.start && match.end <= otherMatch.end;
      });
      return !isNested;
    });
  }
}
