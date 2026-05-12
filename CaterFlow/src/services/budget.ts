export type ParsedBudget = {
  value: number;
  currency: string;
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
