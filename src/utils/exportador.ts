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
}

/**
 * Exporta el reporte semanal a PDF
 */
export function exportarPDF(datos: DatosExportacion, rol: string): void {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(18);
    doc.text('Reporte Semanal - Cuadre Automático', pageWidth / 2, 15, { align: 'center' });
    
    // Período
    doc.setFontSize(12);
    doc.text(
      `Período: ${datos.semana.fecha_inicio} al ${datos.semana.fecha_fin}`,
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
    
    // Desglose por día
    doc.setFontSize(14);
    doc.text('Desglose por Día', 14, yPos);
    yPos += 10;
    
    for (const folder of datos.folders) {
      const registros = datos.registrosPorFolder[folder.id] || [];
      
      // Filtrar registros según el rol
      const registrosFiltrados = registros.filter(r => {
        if (rol === 'Dueño') return true;
        if (rol === 'Usuario_Ingresos') return r.tipo === 'ingreso';
        if (rol === 'Usuario_Egresos') return r.tipo === 'egreso';
        return false;
      });
      
      if (registrosFiltrados.length === 0) continue;
      
      // Verificar si necesitamos una nueva página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Encabezado del día
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${folder.fecha_laboral} - Balance: $${folder.balance_diario?.toFixed(2) || '0.00'}`, 14, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      
      // Tabla de registros
      const registrosData = registrosFiltrados.map(r => [
        r.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
        r.concepto,
        r.empleado,
        r.ruta,
        `$${r.monto.toFixed(2)}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Concepto', 'Empleado', 'Ruta', 'Monto']],
        body: registrosData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: {
          0: { cellWidth: 25 },
          4: { halign: 'right' },
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
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
    
    // Guardar PDF
    const nombreArchivo = `reporte_${datos.semana.fecha_inicio}_${datos.semana.fecha_fin}.pdf`;
    doc.save(nombreArchivo);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('No se pudo generar el archivo PDF');
  }
}

/**
 * Exporta el reporte semanal a XLSX
 */
export function exportarXLSX(datos: DatosExportacion, rol: string): void {
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
    
    // Guardar XLSX
    const nombreArchivo = `reporte_${datos.semana.fecha_inicio}_${datos.semana.fecha_fin}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
  } catch (error) {
    console.error('Error al generar XLSX:', error);
    throw new Error('No se pudo generar el archivo XLSX');
  }
}
