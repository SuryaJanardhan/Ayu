/**
 * Image optimization & compression utility for Ayu.
 * Resizes user photos on an offscreen canvas to prevent database bloat,
 * reducing standard 3-5MB phone photos down to ~30-60KB without visible degradation.
 */

export async function compressImage(
  fileOrBase64: File | string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in environment without Image/Canvas (e.g. testing)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : 'data:image/jpeg;base64,mock');
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

/**
 * Aesthetic fallback SVG data URLs when no custom photo is taken.
 */
export const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  eggs: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23FFF3C4"/><circle cx="40" cy="40" r="22" fill="%23FFE082"/><circle cx="40" cy="40" r="12" fill="%23FFB300"/><rect x="22" y="58" width="36" height="8" rx="4" fill="%23D7CCC8"/></svg>',
  chicken: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23FFE3E3"/><ellipse cx="40" cy="38" rx="24" ry="16" fill="%23FF8A65"/><circle cx="40" cy="56" r="14" fill="%23FAFAFA"/></svg>',
  shake: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23DDE7FF"/><rect x="28" y="24" width="24" height="40" rx="6" fill="%2390CAF9"/><path d="M36 12 L44 24" stroke="%232F6BFF" stroke-width="4" stroke-linecap="round"/></svg>',
  yogurt: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23FFE4D9"/><ellipse cx="40" cy="48" rx="22" ry="14" fill="%23FFFFFF"/><circle cx="34" cy="42" r="4" fill="%237E57C2"/><circle cx="46" cy="44" r="4" fill="%237E57C2"/></svg>',
  generic: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="%23F3E4D8"/><circle cx="40" cy="40" r="22" fill="%23FFFFFF" stroke="%23E0E0E0" stroke-width="3"/><path d="M30 40 Q40 50 50 40" stroke="%23FF5C35" stroke-width="3" fill="none"/></svg>',
};

export function getFoodImageFallback(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('egg') || lower.includes('toast') || lower.includes('sourdough')) {
    return DEFAULT_FOOD_IMAGES.eggs;
  }
  if (lower.includes('chicken') || lower.includes('rice') || lower.includes('meat')) {
    return DEFAULT_FOOD_IMAGES.chicken;
  }
  if (lower.includes('shake') || lower.includes('protein') || lower.includes('whey') || lower.includes('smoothie')) {
    return DEFAULT_FOOD_IMAGES.shake;
  }
  if (lower.includes('yogurt') || lower.includes('berry') || lower.includes('oat') || lower.includes('fruit')) {
    return DEFAULT_FOOD_IMAGES.yogurt;
  }
  return DEFAULT_FOOD_IMAGES.generic;
}
