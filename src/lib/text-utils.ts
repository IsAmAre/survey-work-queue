/**
 * Normalizes text by removing extra spaces and trimming
 * @param text - Input text to normalize
 * @returns Normalized text with single spaces between words
 */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes Thai name for search comparison
 * - Trims leading/trailing spaces
 * - Replaces multiple consecutive spaces with single space
 * - Useful for handling inconsistent spacing in Thai names
 */
export function normalizeThaiName(name: string): string {
  return normalizeText(name);
}