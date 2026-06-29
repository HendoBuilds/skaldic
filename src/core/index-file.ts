/** Parse the PartitionIndex menu payload `|PartitionIndex|a|b|` into song names. */
export function parseIndex(content: string): string[] {
  if (!content) return [];
  return content.split("|").slice(2).filter((s) => s.length > 0);
}

/** Serialize song names back into the menu payload. */
export function serializeIndex(names: string[]): string {
  return "|PartitionIndex|" + names.map((n) => n + "|").join("");
}
