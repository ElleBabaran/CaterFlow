import test from "node:test";
import assert from "node:assert/strict";
import { recommendCateringShops } from "../knowledgeBase";

test("recommendations prioritize within-budget options", async () => {
  const results = await recommendCateringShops("BGC Taguig", "filipino corporate", "PHP 120000", 100);
  assert.equal(results.length > 0, true);
  assert.equal(results[0].within_budget, true);
});

test("recommendations include budget gap when over budget", async () => {
  const results = await recommendCateringShops("Makati", "premium wedding", "PHP 50000", 120);
  assert.equal(results.some((item) => item.budget_gap_php > 0), true);
});
