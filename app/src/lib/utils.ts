import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric value into a currency string based on the provided currency code.
 */
export function formatCurrency(
  value: number, 
  currency: string = 'USD', 
  options: {
    compact?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const { compact = false, minimumFractionDigits, maximumFractionDigits } = options;
  
  const formatter = new Intl.NumberFormat(currency === 'THB' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: minimumFractionDigits !== undefined 
      ? minimumFractionDigits 
      : (value < 1 && value !== 0 ? 4 : 2),
    maximumFractionDigits: maximumFractionDigits !== undefined 
      ? maximumFractionDigits 
      : (value < 1 && value !== 0 ? 4 : 2),
  });

  return formatter.format(value);
}
