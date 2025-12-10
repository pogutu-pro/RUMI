/**
 * Sanitizes user input to prevent XSS attacks.
 * Removes potentially dangerous HTML tags and attributes.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  // Basic sanitization: remove script tags and common XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitizes user image URL to ensure it's safe.
 * Only allows HTTP/HTTPS URLs from trusted domains if needed.
 */
export function sanitizeImageUrl(url: string): string {
  if (typeof url !== 'string' || !url.trim()) return '';

  // Basic URL validation
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    // Could add domain whitelisting here if needed
    return url;
  } catch {
    return '';
  }
}
