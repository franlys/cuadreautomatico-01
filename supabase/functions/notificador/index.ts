// Edge Function: Notificador
// Envía reportes semanales por correo (Resend) y WhatsApp (Twilio/Meta)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface NotificacionRequest {
  semana_id: string;
  destinatario_email: string;
  destinatario_whatsapp: string;
  pdf_base64?: string;
  xlsx_base64?: string;
  incluir_evidencias?: boolean;
}

serve(async (req) => {
  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parsear body
    const body: NotificacionRequest = await req.json();
    const { semana_id, destinatario_email, destinatario_whatsapp, pdf_base64, xlsx_base64, incluir_evidencias } = body;

    // Validar campos requeridos
    if (!semana_id || !destinatario_email) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Crear cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Obtener datos de la semana
    const { data: semana, error: semanaError } = await supabase
      .from('semanas_laborales')
      .select('*')
      .eq('id', semana_id)
      .single();

    if (semanaError || !semana) {
      return new Response(JSON.stringify({ error: 'Semana no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener folders de la semana
    const { data: folders, error: foldersError } = await supabase
      .from('folders_diarios')
      .select('*')
      .eq('semana_id', semana_id)
      .order('fecha_laboral', { ascending: true });

    if (foldersError) {
      throw new Error(`Error al obtener folders: ${foldersError.message}`);
    }

    // Obtener depósitos de la semana
    const { data: depositos, error: depositosError } = await supabase
      .from('depositos')
      .select('*')
      .eq('semana_laboral_id', semana_id)
      .order('fecha_deposito', { ascending: true });

    if (depositosError) {
      throw new Error(`Error al obtener depósitos: ${depositosError.message}`);
    }

    // Preparar resumen
    const resumen = {
      periodo: `${semana.fecha_inicio} al ${semana.fecha_fin}`,
      total_ingresos: semana.total_ingresos,
      total_egresos: semana.total_egresos,
      balance_neto: semana.balance_neto,
      total_depositos: semana.total_depositos,
      saldo_disponible: semana.saldo_disponible,
      folders: folders || [],
      depositos: depositos || [],
    };

    // Enviar correo
    const emailResult = await enviarCorreo(
      destinatario_email,
      resumen,
      pdf_base64,
      xlsx_base64
    );

    // Enviar WhatsApp (si está configurado)
    let whatsappResult = { success: true, message: 'WhatsApp no configurado' };
    if (destinatario_whatsapp && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      whatsappResult = await enviarWhatsApp(
        destinatario_whatsapp,
        resumen
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: emailResult,
        whatsapp: whatsappResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error en notificador:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// Función para enviar correo con Resend
async function enviarCorreo(
  destinatario: string,
  resumen: any,
  pdf_base64?: string,
  xlsx_base64?: string
): Promise<{ success: boolean; message: string }> {
  const MAX_REINTENTOS = 3;
  const INTERVALO_REINTENTO = 5 * 60 * 1000; // 5 minutos

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      // Preparar HTML del correo
      const htmlContent = generarHTMLCorreo(resumen);
      const textContent = generarTextoPlano(resumen);

      // Preparar attachments
      const attachments: any[] = [];
      if (pdf_base64) {
        attachments.push({
          filename: `reporte_${resumen.periodo}.pdf`,
          content: pdf_base64,
        });
      }
      if (xlsx_base64) {
        attachments.push({
          filename: `reporte_${resumen.periodo}.xlsx`,
          content: xlsx_base64,
        });
      }

      // Enviar con Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cuadre Automático <noreply@tudominio.com>',
          to: [destinatario],
          subject: `Reporte Semanal ${resumen.periodo}`,
          html: htmlContent,
          text: textContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de Resend: ${JSON.stringify(errorData)}`);
      }

      return { success: true, message: 'Correo enviado exitosamente' };
    } catch (error: any) {
      console.error(`Intento ${intento} de envío de correo falló:`, error);

      if (intento < MAX_REINTENTOS) {
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, INTERVALO_REINTENTO));
      } else {
        // Último intento falló, registrar error
        return {
          success: false,
          message: `Error al enviar correo después de ${MAX_REINTENTOS} intentos: ${error.message}`,
        };
      }
    }
  }

  return { success: false, message: 'Error desconocido' };
}

// Función para enviar WhatsApp con Twilio
async function enviarWhatsApp(
  destinatario: string,
  resumen: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Preparar mensaje de WhatsApp
    const mensaje = generarMensajeWhatsApp(resumen);

    // Enviar con Twilio
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: `whatsapp:${destinatario}`,
          Body: mensaje,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Twilio: ${JSON.stringify(errorData)}`);
    }

    return { success: true, message: 'WhatsApp enviado exitosamente' };
  } catch (error: any) {
    console.error('Error al enviar WhatsApp:', error);
    return {
      success: false,
      message: `Error al enviar WhatsApp: ${error.message}`,
    };
  }
}

// Generar HTML para el correo
function generarHTMLCorreo(resumen: any): string {
  const foldersHTML = resumen.folders
    .map((f: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${f.fecha_laboral}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${f.total_ingresos.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${f.total_egresos.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">$${f.balance_diario.toFixed(2)}</td>
      </tr>
    `)
    .join('');

  const depositosHTML = resumen.depositos.length > 0
    ? `
      <h3 style="color: #7c3aed; margin-top: 20px;">Depósitos Realizados</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Banco</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${resumen.depositos.map((d: any) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${d.fecha_deposito}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${d.banco || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${d.monto.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte Semanal</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        Reporte Semanal
      </h1>
      <p style="font-size: 16px; color: #666;">
        Período: <strong>${resumen.periodo}</strong>
      </p>

      <h2 style="color: #2563eb; margin-top: 30px;">Resumen Consolidado</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 8px; background-color: #f3f4f6; font-weight: bold;">Total Ingresos:</td>
          <td style="padding: 8px; text-align: right; color: #059669; font-weight: bold;">$${resumen.total_ingresos.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f9fafb; font-weight: bold;">Total Egresos:</td>
          <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">$${resumen.total_egresos.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f3f4f6; font-weight: bold;">Balance Neto:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px;">$${resumen.balance_neto.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f9fafb; font-weight: bold;">Total Depositado:</td>
          <td style="padding: 8px; text-align: right; color: #7c3aed; font-weight: bold;">$${resumen.total_depositos.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f3f4f6; font-weight: bold;">Saldo Disponible:</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px; color: #2563eb;">$${resumen.saldo_disponible.toFixed(2)}</td>
        </tr>
      </table>

      <h3 style="color: #2563eb; margin-top: 30px;">Desglose Diario</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #2563eb; color: white;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Ingresos</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Egresos</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${foldersHTML}
        </tbody>
      </table>

      ${depositosHTML}

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
        Este es un correo automático generado por el sistema Cuadre Automático.
      </p>
    </body>
    </html>
  `;
}

// Generar texto plano para el correo
function generarTextoPlano(resumen: any): string {
  let texto = `REPORTE SEMANAL\n`;
  texto += `Período: ${resumen.periodo}\n\n`;
  texto += `RESUMEN CONSOLIDADO\n`;
  texto += `===================\n`;
  texto += `Total Ingresos: $${resumen.total_ingresos.toFixed(2)}\n`;
  texto += `Total Egresos: $${resumen.total_egresos.toFixed(2)}\n`;
  texto += `Balance Neto: $${resumen.balance_neto.toFixed(2)}\n`;
  texto += `Total Depositado: $${resumen.total_depositos.toFixed(2)}\n`;
  texto += `Saldo Disponible: $${resumen.saldo_disponible.toFixed(2)}\n\n`;

  texto += `DESGLOSE DIARIO\n`;
  texto += `===============\n`;
  resumen.folders.forEach((f: any) => {
    texto += `${f.fecha_laboral}: Ingresos $${f.total_ingresos.toFixed(2)} - Egresos $${f.total_egresos.toFixed(2)} = Balance $${f.balance_diario.toFixed(2)}\n`;
  });

  if (resumen.depositos.length > 0) {
    texto += `\nDEPÓSITOS REALIZADOS\n`;
    texto += `====================\n`;
    resumen.depositos.forEach((d: any) => {
      texto += `${d.fecha_deposito} - ${d.banco || 'N/A'}: $${d.monto.toFixed(2)}\n`;
    });
  }

  return texto;
}

// Generar mensaje para WhatsApp
function generarMensajeWhatsApp(resumen: any): string {
  let mensaje = `📊 *REPORTE SEMANAL*\n`;
  mensaje += `📅 ${resumen.periodo}\n\n`;
  mensaje += `💰 *RESUMEN*\n`;
  mensaje += `✅ Ingresos: $${resumen.total_ingresos.toFixed(2)}\n`;
  mensaje += `❌ Egresos: $${resumen.total_egresos.toFixed(2)}\n`;
  mensaje += `📈 Balance Neto: $${resumen.balance_neto.toFixed(2)}\n`;
  mensaje += `🏦 Depositado: $${resumen.total_depositos.toFixed(2)}\n`;
  mensaje += `💵 Saldo Disponible: $${resumen.saldo_disponible.toFixed(2)}\n\n`;
  mensaje += `📧 Revisa tu correo para el reporte completo con archivos adjuntos.`;

  return mensaje;
}
