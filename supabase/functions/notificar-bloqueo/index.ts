// Edge Function para notificar al Dueño cuando un usuario es bloqueado
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface NotificacionBloqueoRequest {
  emailDueno: string;
  usuarioBloqueado: string;
  emailBloqueado: string;
  bloqueadoHasta: string;
}

serve(async (req) => {
  try {
    const { emailDueno, usuarioBloqueado, emailBloqueado, bloqueadoHasta }: NotificacionBloqueoRequest = await req.json();

    if (!emailDueno || !usuarioBloqueado || !bloqueadoHasta) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Formatear fecha de desbloqueo
    const fechaDesbloqueo = new Date(bloqueadoHasta);
    const fechaFormateada = fechaDesbloqueo.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Enviar correo con Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cuadre Automático <notificaciones@cuadre-automatico.com>',
        to: emailDueno,
        subject: '⚠️ Usuario bloqueado por intentos fallidos',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Alerta de Seguridad</h2>
            <p>Se ha bloqueado temporalmente un usuario por exceder el límite de intentos de inicio de sesión fallidos.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Usuario bloqueado:</strong> ${usuarioBloqueado}</p>
              <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${emailBloqueado}</p>
              <p style="margin: 8px 0 0 0;"><strong>Bloqueado hasta:</strong> ${fechaFormateada}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              El usuario podrá intentar iniciar sesión nuevamente después de 15 minutos.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            
            <p style="color: #9ca3af; font-size: 12px;">
              Este es un mensaje automático del sistema Cuadre Automático.
            </p>
          </div>
        `,
        text: `
⚠️ Alerta de Seguridad

Se ha bloqueado temporalmente un usuario por exceder el límite de intentos de inicio de sesión fallidos.

Usuario bloqueado: ${usuarioBloqueado}
Email: ${emailBloqueado}
Bloqueado hasta: ${fechaFormateada}

El usuario podrá intentar iniciar sesión nuevamente después de 15 minutos.

---
Este es un mensaje automático del sistema Cuadre Automático.
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Error al enviar correo: ${JSON.stringify(errorData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notificación enviada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en notificar-bloqueo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
