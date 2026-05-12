export function hasCurrencyMarker(text: string): boolean {
  const currencySymbols = ['$', '€', '£', '¥', '₱', '₹', '₽', '₩', '₪', '₦', '₨', '฿', '₴', '₵'];
  return currencySymbols.some(symbol => text.includes(symbol));
}

export function extractCurrency(text: string): {
  symbol: string;
  amount: number;
  code: string;
} | null {
  const currencyMap: { [key: string]: string } = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₱': 'PHP',
    '₹': 'INR',
    '₽': 'RUB',
    '₩': 'KRW',
    '₪': 'ILS',
    '₦': 'NGN',
    '₨': 'PKR',
    '฿': 'THB',
    '₴': 'UAH',
    '₵': 'GHS'
  };

  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (text.includes(symbol)) {
      const numberMatch = text.match(/([\d.,]+)/);
      if (numberMatch) {
        const amount = parseFloat(numberMatch[1].replace(/,/g, ''));
        return { symbol, amount, code };
      }
    }
  }

  return null;
}

export function formatBudget(amount: number, currency: string): string {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'PHP': '₱',
    'INR': '₹'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

export function calculatePricePerGuest(totalBudget: number, guestCount: number): number {
  if (guestCount <= 0) return 0;
  return Math.round((totalBudget / guestCount) * 100) / 100;
}

export function estimateTotalCost(
  pricePerGuest: number,
  guestCount: number,
  margin: number = 0.1
): number {
  const baseCost = pricePerGuest * guestCount;
  const additionalCosts = baseCost * margin; // 10% buffer for logistics, labor, etc.
  return Math.round((baseCost + additionalCosts) * 100) / 100;
}
