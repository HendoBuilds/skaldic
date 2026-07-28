/**
 * ASCII-safe song name derived from a MIDI filename. LuteMod handles song names as
 * single-byte text, so any non-ASCII character — e.g. the em-dash in an "Artist — Title"
 * MIDI name — corrupts to '?' in-game and stops the song loading (the mangled name no
 * longer matches its .sav file). We transliterate common punctuation and drop the rest,
 * then strip filesystem- and partition-delimiter-illegal characters.
 */
export function sanitizeName(s: string): string {
  return s
    .replace(/\.midi?$/i, "")
    .replace(/[‐-―]/g, "-") // hyphen/figure/en/em dashes → '-'
    .replace(/[‘’‚‛]/g, "'") // smart single quotes → '
    .replace(/[“”„‟]/g, '"') // smart double quotes → " (stripped below)
    .replace(/…/g, "...") // ellipsis → ...
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics (é → e)
    .replace(/[^\x20-\x7e]/g, "") // drop any remaining non-ASCII
    .replace(/[\\/:*?"<>|;[\]()]+/g, "") // ';' would corrupt the |name;tempo| header
    .replace(/\s+/g, " ")
    .trim();
}

/** Add a song name to the menu list without duplicating. */
export function withSong(names: string[], name: string): string[] {
  return names.includes(name) ? names : [...names, name];
}

/** Remove a song name from the menu list. */
export function withoutSong(names: string[], name: string): string[] {
  return names.filter((n) => n !== name);
}
