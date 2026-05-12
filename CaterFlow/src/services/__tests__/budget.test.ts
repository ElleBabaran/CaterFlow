import test from "node:test";
import assert from "node:assert/strict";
import { parseBudgetDetails, hasCurrencyMarker } from "../budget";

test("parseBudgetDetails extracts amount and currency", () => {
  const parsed = parseBudgetDetails("₱ 150,000");
  assert.equal(parsed.currency, "PHP");
  assert.equal(parsed.value, 150000);
});

test("parseBudgetDetails defaults to PHP when currency missing", () => {
  const parsed = parseBudgetDetails("250000");
  assert.equal(parsed.currency, "PHP");
  assert.equal(parsed.value, 250000);
});

test("hasCurrencyMarker identifies currency markers", () => {
  assert.equal(hasCurrencyMarker("USD 5000"), true);
  assert.equal(hasCurrencyMarker("5000"), false);
});
