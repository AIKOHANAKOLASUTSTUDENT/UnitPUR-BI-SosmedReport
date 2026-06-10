import * as XLSX from 'xlsx';

function toCsvValue(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildExportFile(platform, format, fields, rows) {
  const sanitizedRows = rows.map((row) => {
    const output = {};
    for (const field of fields) {
      output[field] = row[field] ?? '';
    }
    return output;
  });

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const headers = fields;
    const csv = [
      headers.join(','),
      ...sanitizedRows.map((row) => headers.map((header) => toCsvValue(row[header])).join(',')),
    ].join('\n');

    return {
      filename: `${platform}_report_${timestamp}.csv`,
      contentType: 'text/csv;charset=utf-8',
      buffer: Buffer.from(csv, 'utf8'),
    };
  }

  const worksheet = XLSX.utils.json_to_sheet(sanitizedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, platform);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return {
    filename: `${platform}_report_${timestamp}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer,
  };
}
