export function parseDelimited(csvText: string, delimiter = ';'): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (nonEmpty.length < 2) return [];

  const headers = nonEmpty[0].map((h) => h.trim());

  return nonEmpty.slice(1).map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      record[header] = cells[i]?.trim() ?? '';
    });
    return record;
  });
}
