import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Resumen
    const resumenData = [
      ['Reporte Semanal - Cuadre Automático'],
      [`Período: ${datos.semana.fecha_inicio} al ${datos.semana.fecha_fin}`],
      [],
      ['Concepto', 'Monto'],
      ['Total Ingresos', datos.semana.total_ingresos?.toFixed(2) || '0.00'],
      ['Total Egresos', datos.semana.total_egresos?.toFixed(2) || '0.00'],
      ['Balance Neto', datos.semana.balance_neto?.toFixed(2) || '0.00'],
    ];
    
    if (rol === 'Dueño') {
      resumenData.push(
        ['Total Depositado', datos.semana.total_depositos?.toFixed(2) || '0.00'],
        ['Saldo Disponible', datos.semana.saldo_disponible?.toFixed(2) || '0.00']
      );
    }
    
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');
    
    // Hoja 2: Registros detallados
    const registrosData: any[][] = [
      ['Fecha', 'Tipo', 'Concepto', 'Empleado', 'Ruta', 'Monto', 'Balance Diario'],
    ];
    
    for (const folder of datos.folders) {
      const registros = datos.registrosPorFolder[folder.id] || [];
      
      // Filtrar registros según el rol
      const registrosFiltrados = registros.filter(r => {
        if (rol === 'Dueño') return true;
        if (rol === 'Usuario_Ingresos') return r.tipo === 'ingreso';
        if (rol === 'Usuario_Egresos') return r.tipo === 'egreso';
        return false;
      });
      
      for (const registro of registrosFiltrados) {
        registrosData.push([
          folder.fecha_laboral,
          registro.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
          registro.concepto,
          registro.empleado,
          registro.ruta,
          registro.monto.toFixed(2),
          folder.balance_diario?.toFixed(2) || '0.00',
        ]);
      }
    }
    
    const wsRegistros = XLSX.utils.aoa_to_sheet(registrosData);
    XLSX.utils.book_append_sheet(workbook, wsRegistros, 'Registros');
    
    // Hoja 3: Depósitos (solo para Dueño)
    if (rol === 'Dueño' && datos.depositos && datos.depositos.length > 0) {
      const depositosData: any[][] = [
        ['Fecha', 'Banco', 'Nota', 'Monto'],
      ];
      
      for (const deposito of datos.depositos) {
        depositosData.push([
          deposito.fecha_deposito,
          deposito.banco || 'N/A',
          deposito.nota || '',
          deposito.monto.toFixed(2),
        ]);
      }
      
      const wsDepositos = XLSX.utils.aoa_to_sheet(depositosData);
      XLSX.utils.book_append_sheet(workbook, wsDepositos, 'Depósitos');
    }
    
    // Generar Blob
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const xlsxBlob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Descargar si se solicita
    if (descargar) {
      const nombreArchivo = `reporte_${datos.semana.fecha_inicio}_${datos.semana.fecha_fin}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);
    }
    
    return xlsxBlob;
  } catch (error) {
    console.error('Error al generar XLSX:', error);
    throw new Error('No se pudo generar el archivo XLSX');
  }
}
