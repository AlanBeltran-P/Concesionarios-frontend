/** Un PDF de una página con líneas de texto (Helvetica). Alcanza para el comprobante de la demo. */
export function pdfSimple(lineas: string[]): Blob {
  const escapar = (t: string) => t.replace(/[\\()]/g, (c) => '\\' + c);
  const texto = lineas
    .map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 56 ${780 - i * 20} Td (${escapar(l)}) Tj ET`)
    .join('\n');
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${texto.length} >>\nstream\n${texto}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let pdf = '%PDF-1.4\n';
  const posiciones: number[] = [];
  objetos.forEach((o, i) => {
    posiciones.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Un byte por carácter (Latin-1), así las posiciones del xref coinciden y los acentos se ven bien.
  const bytes = Uint8Array.from(pdf, (c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63));
  return new Blob([bytes], { type: 'application/pdf' });
}
