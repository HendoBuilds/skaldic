import { test, expect } from "vitest";
import { parseIndex, serializeIndex } from "./index-file";

test("parse + serialize round-trips the menu list", () => {
  const content = "|PartitionIndex|SmellsLikeTeenSpirit|SkaldicDuet|";
  expect(parseIndex(content)).toEqual(["SmellsLikeTeenSpirit", "SkaldicDuet"]);
  expect(serializeIndex(["SmellsLikeTeenSpirit", "SkaldicDuet"])).toBe(content);
});

test("empty index", () => {
  expect(parseIndex("")).toEqual([]);
  expect(serializeIndex([])).toBe("|PartitionIndex|");
});
