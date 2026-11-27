export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDiscountPercent(price: number, mrp?: number): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  discountRate: number;
  label: string;
}

const VALID_PROMOS: Record<string, { rate: number; label: string }> = {
  LAB15: { rate: 0.15, label: '15% Academic & R&D Lab Discount' },
  ELECTRO10: { rate: 0.10, label: '10% Welcome Engineering Credit' },
};

export function validatePromoCode(rawCode: string): PromoValidationResult {
  const code = rawCode.trim().toUpperCase();
  const match = VALID_PROMOS[code];
  if (!match) {
    return { valid: false, code, discountRate: 0, label: '' };
  }
  return {
    valid: true,
    code,
    discountRate: match.rate,
    label: match.label,
  };
}
