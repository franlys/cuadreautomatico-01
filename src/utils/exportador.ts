import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import type { SemanaLaboral, FolderDiario, Registro } from '../types';

interface DatosExportacion {
  semana: SemanaLaboral;
  folders: FolderDiario[];
  registrosPorFolder: Record<string, Registro[]>;
  depositos?: Array<{
    monto: number;
    fecha_deposito: string;
    banco: string | null;
    nota: string | null;
  }>;
  nombreEmpresa?: string;
}

/**
 * Exporta el reporte semanal a PDF
 * @param descargar - Si es true, descarga el archivo. Si es false, solo retorna el Blob
 */
export function exportarPDF(datos: DatosExportacion, rol: string, descargar: boolean = true): Blob {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título (nombre de empresa)
    doc.setFontSize(18);
    doc.text(datos.nombreEmpresa || 'Reporte Semanal', pageWidth / 2, 15, { align: 'center' });

    // Subtítulo
    doc.setFontSize(12);
    doc.text(
      `ENTRADA DE DIARIOS SEMANA DEL ${datos.semana.fecha_inicio} al ${datos.semana.fecha_fin}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    let yPos = 35;

    // Resumen semanal
    doc.setFontSize(14);
    doc.text('Resumen Semanal', 14, yPos);
    yPos += 10;

    const resumenData = [
      ['Total Ingresos', `$${datos.semana.total_ingresos?.toFixed(2) || '0.00'}`],
      ['Total Egresos', `$${datos.semana.total_egresos?.toFixed(2) || '0.00'}`],
      ['Balance Neto', `$${datos.semana.balance_neto?.toFixed(2) || '0.00'}`],
    ];

    if (rol === 'Dueño') {
      resumenData.push(
        ['Total Depositado', `$${datos.semana.total_depositos?.toFixed(2) || '0.00'}`],
        ['Saldo Disponible', `$${datos.semana.saldo_disponible?.toFixed(2) || '0.00'}`]
      );
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Monto']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Consolidar todos los registros en orden cronológico
    const registrosConsolidados: Array<{
      fecha: string;
      tipo: 'ingreso' | 'egreso';
      concepto: string;
      empleado: string;
      ruta: string;
      monto: number;
      created_at: string;
      saldoAcumulado: number;
    }> = [];

    for (const folder of datos.folders) {
      const registros = datos.registrosPorFolder[folder.id] || [];
      const registrosFiltrados = registros.filter(r => {
        if (rol === 'Dueño') return true;
        if (rol === 'Usuario_Ingresos') return r.tipo === 'ingreso';
        if (rol === 'Usuario_Egresos') return r.tipo === 'egreso';
        return false;
      });
      for (const r of registrosFiltrados) {
        registrosConsolidados.push({
          fecha: folder.fecha_laboral,
          tipo: r.tipo,
          concepto: r.concepto,
          empleado: r.empleado,
          ruta: r.ruta,
          monto: r.monto,
          created_at: r.created_at,
          saldoAcumulado: 0,
        });
      }
    }

    // Ordenar por fecha y luego por created_at
    registrosConsolidados.sort((a, b) => {
      const fechaDiff = a.fecha.localeCompare(b.fecha);
      if (fechaDiff !== 0) return fechaDiff;
      return a.created_at.localeCompare(b.created_at);
    });

    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    for (const r of registrosConsolidados) {
      if (r.tipo === 'ingreso') saldoAcumulado += r.monto;
      else saldoAcumulado -= r.monto;
      r.saldoAcumulado = saldoAcumulado;
    }

    // Tabla única de registros
    const tiposFilas: Array<'ingreso' | 'egreso'> = registrosConsolidados.map(r => r.tipo);
    const tablaData = registrosConsolidados.map(r => [
      r.fecha,
      [r.concepto, r.empleado, r.ruta].filter(Boolean).join(' - '),
      r.tipo === 'ingreso' ? r.monto.toFixed(2) : '',
      r.tipo === 'egreso' ? r.monto.toFixed(2) : '',
      r.saldoAcumulado.toFixed(2),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO']],
      body: tablaData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 72 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 24, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const tipo = tiposFilas[data.row.index];
          if (tipo === 'ingreso') {
            data.cell.styles.fillColor = [255, 255, 0];
          } else {
            data.cell.styles.fillColor = [255, 255, 255];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Depósitos (solo para Dueño)
    if (rol === 'Dueño' && datos.depositos && datos.depositos.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Depósitos Bancarios', 14, yPos);
      yPos += 10;
      
      const depositosData = datos.depositos.map(d => [
        d.fecha_deposito,
        d.banco || 'N/A',
        d.nota || '',
        `$${d.monto.toFixed(2)}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Banco', 'Nota', 'Monto']],
        body: depositosData,
        theme: 'grid',
        headStyles: { fillColor: [147, 51, 234] },
        columnStyles: {
          3: { halign: 'right' },
        },
      });
    }
    
    // Generar Blob
    const pdfBlob = doc.output('blob');
    
    // Descargar si se solicita
    if (descargar) {
      const nombreArchivo = `reporte_${datos.semana.fecha_inicio}_${datos.semana.fecha_fin}.pdf`;
      doc.save(nombreArchivo);
    }
    
    return pdfBlob;
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('No se pudo generar el archivo PDF');
  }
}

/**
 * Exporta el reporte semanal a XLSX
 * @param descargar - Si es true, descarga el archivo. Si es false, solo retorna el Blob
 */
export function exportarXLSX(datos: DatosExportacion, rol: string, descargar: boolean = true): Blob {
  try {
    const workbook = XLSXStyle.utils.book_new();

    // ── Estilos reutilizables ──────────────────────────────────────────────
    const FILL_GREEN  = { patternType: 'solid', fgColor: { rgb: 'D5E8D4' } };
    const FILL_YELLOW = { patternType: 'solid', fgColor: { rgb: 'FFFF00' } };
    const FILL_WHITE  = { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } };
    const ALIGN_CENTER = { horizontal: 'center', vertical: 'center' };
    const ALIGN_RIGHT  = { horizontal: 'right',  vertical: 'center' };

    const styleTitle: any = {
      font: { bold: true, italic: true, sz: 16 },
      fill: FILL_GREEN,
      alignment: ALIGN_CENTER,
    };
    const styleSubtitle: any = {
      font: { sz: 11 },
      fill: FILL_GREEN,
      alignment: ALIGN_CENTER,
    };
    const styleHeader: any = {
      font: { bold: true },
      alignment: ALIGN_CENTER,
      border: {
        top:    { style: 'thin' }, bottom: { style: 'thin' },
        left:   { style: 'thin' }, right:  { style: 'thin' },
      },
    };
    const borderThin: any = {
      top:    { style: 'thin' }, bottom: { style: 'thin' },
      left:   { style: 'thin' }, right:  { style: 'thin' },
    };

    // ── Consolidar registros (mismo orden que PDF) ────────────────────────
    const consolidados: Array<{
      fecha: string; tipo: 'ingreso' | 'egreso';
      descripcion: string; monto: number; created_at: string; saldo: number;
    }> = [];

    for (const folder of datos.folders) {
      const registros = datos.registrosPorFolder[folder.id] || [];
      const filtrados = registros.filter(r => {
        if (rol === 'Dueño') return true;
        if (rol === 'Usuario_Ingresos') return r.tipo === 'ingreso';
        if (rol === 'Usuario_Egresos') return r.tipo === 'egreso';
        return false;
      });
      for (const r of filtrados) {
        consolidados.push({
          fecha: folder.fecha_laboral,
          tipo: r.tipo,
          descripcion: [r.concepto, r.empleado, r.ruta].filter(Boolean).join(' - '),
          monto: r.monto,
          created_at: r.created_at,
          saldo: 0,
        });
      }
    }
    consolidados.sort((a, b) => {
      const d = a.fecha.localeCompare(b.fecha);
      return d !== 0 ? d : a.created_at.localeCompare(b.created_at);
    });
    let saldoAcc = 0;
    for (const r of consolidados) {
      saldoAcc += r.tipo === 'ingreso' ? r.monto : -r.monto;
      r.saldo = saldoAcc;
    }

    // ── Hoja principal: Registros ─────────────────────────────────────────
    // Filas de datos como AOA
    const nombreEmpresa = datos.nombreEmpresa || 'Reporte Semanal';
    const subtitulo = `ENTRADA DE DIARIOS SEMANA DEL ${datos.semana.fecha_inicio} al ${datos.semana.fecha_fin}`;

    const aoa: any[][] = [
      [nombreEmpresa, '', '', '', ''],   // fila 0 → A1
      [subtitulo,     '', '', '', ''],   // fila 1 → A2
      ['FECHAS', 'DESCRIPCION', 'INGRESO', 'EGRESO', 'SALDO'], // fila 2 → A3
    ];

    for (const r of consolidados) {
      aoa.push([
        r.fecha,
        r.descripcion,
        r.tipo === 'ingreso' ? r.monto : '',
        r.tipo === 'egreso'  ? r.monto : '',
        r.saldo,
      ]);
    }

    const wsReg = XLSXStyle.utils.aoa_to_sheet(aoa);

    // Merges para título y subtítulo
    wsReg['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    ];

    // Anchos de columna
    wsReg['!cols'] = [
      { wch: 14 },  // FECHAS
      { wch: 50 },  // DESCRIPCION
      { wch: 16 },  // INGRESO
      { wch: 16 },  // EGRESO
      { wch: 16 },  // SALDO
    ];

    // Altura de filas de encabezado
    wsReg['!rows'] = [{ hpt: 28 }, { hpt: 18 }];

    // Aplicar estilos a título y subtítulo
    wsReg['A1'].s = styleTitle;
    wsReg['A2'].s = styleSubtitle;

    // Aplicar estilos a encabezados de columna (fila 3)
    ['A3', 'B3', 'C3', 'D3', 'E3'].forEach(addr => {
      if (wsReg[addr]) wsReg[addr].s = styleHeader;
    });

    // Aplicar estilos a filas de datos
    const COLS = ['A', 'B', 'C', 'D', 'E'];
    consolidados.forEach((r, i) => {
      const rowNum = i + 4; // datos empiezan en fila 4
      const fill = r.tipo === 'ingreso' ? FILL_YELLOW : FILL_WHITE;
      COLS.forEach((col, ci) => {
        const addr = `${col}${rowNum}`;
        if (!wsReg[addr]) wsReg[addr] = { v: '', t: 's' };
        // Alineación: números a la derecha (cols 2,3,4)
        const alignment = ci >= 2 ? ALIGN_RIGHT : { vertical: 'center' };
        wsReg[addr].s = { fill, border: borderThin, alignment };
      });
    });

    XLSXStyle.utils.book_append_sheet(workbook, wsReg, 'Registros');

    // ── Hoja Resumen ──────────────────────────────────────────────────────
    const resumenData: any[][] = [
      [nombreEmpresa],
      [subtitulo],
      [],
      ['Concepto', 'Monto'],
      ['Total Ingresos', datos.semana.total_ingresos?.toFixed(2) || '0.00'],
      ['Total Egresos',  datos.semana.total_egresos?.toFixed(2)  || '0.00'],
      ['Balance Neto',   datos.semana.balance_neto?.toFixed(2)   || '0.00'],
    ];
    if (rol === 'Dueño') {
      resumenData.push(
        ['Total Depositado', datos.semana.total_depositos?.toFixed(2) || '0.00'],
        ['Saldo Disponible', datos.semana.saldo_disponible?.toFixed(2) || '0.00']
      );
    }
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSXStyle.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

    // ── Hoja Depósitos (solo Dueño) ───────────────────────────────────────
    if (rol === 'Dueño' && datos.depositos && datos.depositos.length > 0) {
      const depositosData: any[][] = [['Fecha', 'Banco', 'Nota', 'Monto']];
      for (const d of datos.depositos) {
        depositosData.push([d.fecha_deposito, d.banco || 'N/A', d.nota || '', d.monto.toFixed(2)]);
      }
      const wsDepositos = XLSX.utils.aoa_to_sheet(depositosData);
      XLSXStyle.utils.book_append_sheet(workbook, wsDepositos, 'Depósitos');
    }

    // ── Generar Blob ──────────────────────────────────────────────────────
    const xlsxBuffer = XLSXStyle.write(workbook, { bookType: 'xlsx', type: 'array' });
    const xlsxBlob = new Blob([xlsxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    if (descargar) {
      const nombreArchivo = `reporte_${datos.semana.fecha_inicio}_${datos.semana.fecha_fin}.xlsx`;
      XLSXStyle.writeFile(workbook, nombreArchivo);
    }

    return xlsxBlob;
  } catch (error) {
    console.error('Error al generar XLSX:', error);
    throw new Error('No se pudo generar el archivo XLSX');
  }
}
