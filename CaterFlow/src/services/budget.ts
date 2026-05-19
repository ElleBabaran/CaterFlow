export type ParsedBudget = {
  value: number;
  currency: string;
};

export type OrderFinanceLine = {
  dish: string;
  category: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type OrderFinanceSummary = {
  currency: string;
  guestCount: number;
  budgetTotal: number;
  totalPerGuest: number;
  estimatedTotal: number;
  remaining: number;
  utilizationPct: number;
  isOverBudget: boolean;
  lines: OrderFinanceLine[];
};

const SYMBOL_TO_CURRENCY: Record<string, string> = {
  "₱": "PHP",
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
};

export function parseBudgetDetails(value = ""): ParsedBudget {
  const text = String(value || "").trim();
  const symbol = text.match(/[₱$€£¥₹]/)?.[0] || "";
  const code = text.match(/\b(PHP|USD|EUR|GBP|JPY|INR|CAD|AUD|SGD|CNY|PESO|PESOS)\b/i)?.[1];
  const currency = normalizeCurrency(code || symbol || "PHP");

  const numeric = text
    .replace(/[, ]/g, "")
    .match(/\d+(?:\.\d+)?/)?.[0];
  const amount = numeric ? Number(numeric) : 0;

  return { value: Number.isFinite(amount) ? amount : 0, currency };
}

export function normalizeCurrency(value = "PHP") {
  const upper = value.toUpperCase();
  if (SYMBOL_TO_CURRENCY[value]) return SYMBOL_TO_CURRENCY[value];
  if (upper === "PESO" || upper === "PESOS") return "PHP";
  return upper;
}

export function hasCurrencyMarker(value = "") {
  return /[₱$€£¥₹]|\b(PHP|USD|EUR|GBP|JPY|INR|CAD|AUD|SGD|CNY|PESO|PESOS)\b/i.test(String(value));
}

export function formatCurrencyAmount(amount: number, currency = "PHP") {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (currency === "PHP") {
    return `₱${safeAmount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (currency === "USD") {
    return `$${safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${safeAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function calculateOrderFinance(
  menu: any[] = [],
  guestCount = 0,
  statedBudget = "",
  pricingStep: any = {}
): OrderFinanceSummary {
  const parsedBudget = parseBudgetDetails(statedBudget);
  const quoteFallback = parseBudgetDetails(pricingStep?.optimized_quote || pricingStep?.total_estimate || "");
  const currency = parsedBudget.currency || quoteFallback.currency || "PHP";
  const guests = Math.max(1, Number(guestCount) || 1);

  const lines = (Array.isArray(menu) ? menu : [])
    .map((item) => {
      // price is per-pax (per person). lineTotal = unitCost × guests
      const rawPrice = String(item?.price || item?.unit_price || "");
      let unitCost = parseBudgetDetails(rawPrice).value;
      // Fallback: try extracting digits from strings like "PHP 350/pax", "350 per person"
      if (unitCost === 0 && rawPrice) {
        const digits = rawPrice.replace(/[, ]/g, "").match(/\d+(?:\.\d+)?/);
        if (digits) unitCost = Number(digits[0]);
      }
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      return {
        dish: String(item?.dish || item?.name || "Menu item"),
        category: String(item?.category || item?.tags?.[0] || "Main"),
        quantity,
        unitCost,
        // price is per-pax; total = unitCost × guests (quantity = servings count, not price multiplier)
        lineTotal: unitCost * guests,
      };
    })
    .filter((line) => line.unitCost > 0);

  // totalPerGuest = sum of all per-pax prices across dishes
  const totalPerGuest = lines.reduce((sum, line) => sum + line.unitCost, 0);
  const menuTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const estimatedTotal = menuTotal > 0 ? menuTotal : quoteFallback.value;
  const budgetTotal = parsedBudget.value;
  const remaining = budgetTotal - estimatedTotal;
  const utilizationPct = budgetTotal > 0 && estimatedTotal > 0
    ? Math.round((estimatedTotal / budgetTotal) * 100)
    : 0;

  return {
    currency,
    guestCount: guests,
    budgetTotal,
    totalPerGuest,
    estimatedTotal,
    remaining,
    utilizationPct,
    isOverBudget: budgetTotal > 0 && estimatedTotal > budgetTotal,
    lines,
  };
}

export function estimateCookingMinutes(menu: any[] = [], guestCount = 0) {
  const guests = Math.max(1, Number(guestCount) || 1);
  const items = (Array.isArray(menu) ? menu : []).map((item) => {
    const explicit = parseBudgetDetails(item?.cooking_time || item?.estimated_cooking_time || "").value;
    const category = String(item?.category || item?.tags?.[0] || "").toLowerCase();
    const name = String(item?.dish || item?.name || "").toLowerCase();
    const base = explicit || (
      /drink|beverage|juice|tea|soda|mocktail/.test(category + " " + name) ? 10 :
      /dessert|cake|pastry|sweet/.test(category + " " + name) ? 45 :
      /roast|beef|pork|grill|chicken|seafood|fish/.test(category + " " + name) ? 60 :
      35
    );
    const scaled = base + Math.ceil(guests / 25) * 8;
    return {
      dish: String(item?.dish || item?.name || "Menu item"),
      minutes: Math.max(10, Math.round(scaled)),
    };
  });

  const totalMinutes = items.length === 0
    ? 0
    : Math.max(...items.map((item) => item.minutes)) + Math.ceil(items.length / 3) * 15;

  return { totalMinutes, items };
}
