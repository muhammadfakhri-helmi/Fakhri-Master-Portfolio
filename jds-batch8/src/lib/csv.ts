// Excel-compatible CSV: UTF-8 with BOM, CRLF line endings, every cell quoted,
// and cells that a spreadsheet would treat as a formula are neutralised.

export type Delimiter = "," | ";";

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value !== "number" && FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: unknown[][], delimiter: Delimiter = ","): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(delimiter));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
