import JSZip from 'jszip';

interface GenerateXlsxOptions {
  sheetName: string;
  data: Record<string, string | number>[];
  columnWidths?: Record<string, number>;
}

/**
 * Generates an xlsx buffer from tabular data using jszip.
 * Supports column widths and bold header row with light purple fill.
 */
export async function generateXlsx(options: GenerateXlsxOptions): Promise<Buffer> {
  const { sheetName, data, columnWidths } = options;

  if (!data.length) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const zip = new JSZip();

  // Shared strings (all unique string values)
  const sharedStrings: string[] = [];
  const sharedStringIndex = new Map<string, number>();

  function getSharedStringIndex(value: string): number {
    const existing = sharedStringIndex.get(value);
    if (existing !== undefined) return existing;
    const idx = sharedStrings.length;
    sharedStrings.push(value);
    sharedStringIndex.set(value, idx);
    return idx;
  }

  // Pre-collect all strings
  headers.forEach((h) => getSharedStringIndex(h));
  data.forEach((row) => {
    headers.forEach((h) => {
      const val = row[h];
      if (typeof val === 'string') getSharedStringIndex(val);
    });
  });

  // Build sheet XML rows
  const sheetRows: string[] = [];

  // Header row (row 1) - uses style index 1 (bold + fill)
  const headerCells = headers.map((h, colIdx) => {
    const cellRef = colToLetter(colIdx) + '1';
    const ssIdx = getSharedStringIndex(h);
    return `<c r="${cellRef}" t="s" s="1"><v>${ssIdx}</v></c>`;
  }).join('');
  sheetRows.push(`<row r="1">${headerCells}</row>`);

  // Data rows
  data.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2;
    const cells = headers.map((h, colIdx) => {
      const cellRef = colToLetter(colIdx) + rowNum;
      const val = row[h];
      if (typeof val === 'number') {
        return `<c r="${cellRef}" s="0"><v>${val}</v></c>`;
      }
      const str = val == null ? '' : String(val);
      const ssIdx = getSharedStringIndex(str);
      return `<c r="${cellRef}" t="s" s="0"><v>${ssIdx}</v></c>`;
    }).join('');
    sheetRows.push(`<row r="${rowNum}">${cells}</row>`);
  });

  // Column width definitions
  let colsXml = '';
  if (columnWidths) {
    const colDefs = headers.map((h, idx) => {
      const width = columnWidths[h] || 15;
      const col = idx + 1;
      return `<col min="${col}" max="${col}" width="${width}" customWidth="1"/>`;
    }).join('');
    colsXml = `<cols>${colDefs}</cols>`;
  }

  const lastCol = colToLetter(headers.length - 1);
  const lastRow = data.length + 1;
  const dimension = `A1:${lastCol}${lastRow}`;

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`);

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  // xl/workbook.xml
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);

  // xl/_rels/workbook.xml.rels
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`);

  // xl/styles.xml (style 0 = default, style 1 = bold + fill)
  zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE6E6FA"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`);

  // xl/sharedStrings.xml
  const ssItems = sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('');
  zip.file('xl/sharedStrings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
${ssItems}
</sst>`);

  // xl/worksheets/sheet1.xml
  zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  ${colsXml}
  <sheetData>
${sheetRows.join('\n')}
  </sheetData>
</worksheet>`);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer;
}

function colToLetter(colIndex: number): string {
  let result = '';
  let n = colIndex;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
