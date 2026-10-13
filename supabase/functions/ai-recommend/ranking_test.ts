import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { dynamicTopK, rrfFuse, sanitizePlan, safeKeyword } from "./ranking.ts";

Deno.test("dynamicTopK cuts when relevance drops below 80% of best", () => {
  assertEquals(dynamicTopK([0.9, 0.85, 0.8, 0.5, 0.4, 0.3]), 3);
  assertEquals(dynamicTopK([0.9, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81]), 8);
});

Deno.test("rrfFuse ranks items found by both retrievers first", () => {
  const out = rrfFuse([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }]);
  assertEquals(out[0].id, "b");
});

Deno.test("sanitizePlan drops unknown categories and clamps rating", () => {
  const p = sanitizePlan({ categories: ["写作", "不存在"], min_rating: 9, tags: [1, "x"] }, ["写作"]);
  assertEquals(p.categories, ["写作"]);
  assertEquals(p.min_rating, 5);
  assertEquals(p.tags, ["x"]);
});

Deno.test("safeKeyword removes filter-breaking characters", () => {
  assertEquals(safeKeyword("a,b(c)%"), "a b c");
});
