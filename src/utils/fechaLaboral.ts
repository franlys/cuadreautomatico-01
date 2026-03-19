/**
 * Regla del Lunes: Los registros ingresados el lunes pertenecen al sábado anterior
 * porque el negocio opera de lunes a sábado y los domingos no se trabaja.
 * 
 * Lógica:
 * - Lunes (día 1) → Sábado anterior (día -2)
 * - Martes a Sábado (días 2-6) → Mismo día
 * - Domingo (día 0) → No debería ocurrir, pero se trata como sábado anterior
 */
export function obtenerFechaLaboral(fecha: Date): string {
  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
  let fechaLaboral: Date;
  
  if (diaSemana === 1) {
    // Lunes: retroceder 2 días para llegar al sábado anterior
    fechaLaboral = new Date(fecha);
    fechaLaboral.setDate(fecha.getDate() - 2);
  } else if (diaSemana === 0) {
    // Domingo: retroceder 1 día para llegar al sábado
    fechaLaboral = new Date(fecha);
    fechaLaboral.setDate(fecha.getDate() - 1);
  } else {
    // Martes a Sábado: usar el mismo día
    fechaLaboral = fecha;
  }
  
  // Retornar en formato YYYY-MM-DD
  return fechaLaboral.toISOString().split('T')[0];
}

/**
 * Obtiene el rango de fechas de la semana laboral actual
 * (lunes a sábado, considerando la Regla del Lunes)
 */
export function obtenerRangoSemanaLaboral(fecha: Date): { inicio: string; fin: string } {
  const diaSemana = fecha.getDay();
  const fechaActual = new Date(fecha);
  
  // Calcular el lunes de la semana actual
  let diasHastaLunes: number;
  if (diaSemana === 0) {
    // Domingo: ir al lunes anterior (6 días atrás)
    diasHastaLunes = 6;
  } else {
    // Lunes a Sábado: calcular días hasta el lunes
    diasHastaLunes = diaSemana - 1;
  }
  
  const lunes = new Date(fechaActual);
  lunes.setDate(fechaActual.getDate() - diasHastaLunes);
  
  // El sábado es 5 días después del lunes
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  
  return {
    inicio: lunes.toISOString().split('T')[0],
    fin: sabado.toISOString().split('T')[0],
  };
}

/**
 * Formatea una fecha para mostrar en la UI
 */
export function formatearFecha(fecha: string): string {
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Obtiene el nombre del día de la semana
 */
export function obtenerNombreDia(fecha: string): string {
  const date = new Date(fecha + 'T00:00:00');
  return date.toLocaleDateString('es-MX', { weekday: 'long' });
}
