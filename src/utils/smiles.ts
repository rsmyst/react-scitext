// Split content to identify SMILES code
export function splitSmiles(content: string): string[] {
  return content.split(/(<smiles>.*?<\/smiles>)/gs);
}

// Check if fragment is SMILES code
export function isSmilesCode(fragment: string): RegExpMatchArray | null {
  return fragment.match(/<smiles>(.*?)<\/smiles>/s);
}

// Validate SMILES code for basic safety
export function validateSmilesCode(smilesCode: string): boolean {
  if (!smilesCode || typeof smilesCode !== 'string') {
    return false;
  }

  // Basic length check to prevent extremely long SMILES
  if (smilesCode.length > 1000) {
    return false;
  }

  // Check for basic SMILES character set
  const validSmilesPattern = /^[a-zA-Z0-9\[\]()=#@+\-\\\/:.%]+$/;
  return validSmilesPattern.test(smilesCode);
}

// Sanitize SMILES code
export function sanitizeSmilesCode(smilesCode: string): string {
  // Remove any potential HTML/script tags
  return smilesCode
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

// Extract SMILES code from a SMILES fragment
export function extractSmilesCode(fragment: string): string | null {
  const match = isSmilesCode(fragment);
  return match ? match[1] : null;
}