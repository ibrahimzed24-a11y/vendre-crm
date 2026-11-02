/**
 * Neutralizes Excel / CSV formula injection (CWE-1236)
 * Prefixes sensitive formula trigger characters with a single quote (')
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // If starts with =, +, -, @, \t, or \r prepend single quote to neutralize formula execution
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsv<T extends Record<string, any>>(
  columns: { key: keyof T | string; header: string }[],
  data: T[]
): string {
  const headerRow = columns.map((col) => sanitizeCsvField(col.header)).join(",");
  const dataRows = data.map((item) =>
    columns
      .map((col) => {
        const val = item[col.key as keyof T];
        return sanitizeCsvField(val);
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\r\n");
}

export function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Simple, robust RFC-compliant token-based line parser
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ",") {
          fields.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^['"]|['"]$/g, "").trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || "";
      // Strip leading formula neutralizing quote if present for DB ingestion
      if (val.startsWith("'") && /^[=+\-@\t\r]/.test(val.slice(1))) {
        val = val.slice(1);
      }
      rowObj[h] = val;
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}
