import { supabase } from '../lib/supabase';
import type { 
  HojaRuta, 
  FacturaRuta, 
  GastoRuta, 
  BalanceRuta,
  Moneda,
  EstadoHojaRuta
} from '../types';

/**
 * Input para crear una hoja de ruta
 */
export interface CreateHojaRutaInput {
  empleado_id: string;
  ruta_id: string;
  fecha: string;
  monto_asignado_rdp: number;
  facturas: Array<{
    numero: string;
    monto: number;
    moneda: Moneda;
    estado_pago: 'pendiente' | 'pagada';
  }>;
}

/**
 * Input para registrar un gasto
 */
export interface RegisterGastoInput {
  tipo: 'fijo' | 'peaje' | 'combustible' | 'inesperado';
  descripcion?: string;
  monto: number;
  moneda: Moneda;
  evidencia_requerida: boolean;
  evidencia_id?: string;
}

/**
 * Input para marcar factura como cobrada
 */
export interface MarkFacturaCobradaInput {
  monto_cobrado: number;
  moneda_cobrada: Moneda;
}

/**
 * Input para cerrar una ruta
 */
export interface CloseRutaInput {
  monto_fisico_rdp: number;
  monto_fisico_usd: number;
}

/**
 * Servicio para gestión de hojas de ruta digitales (Automatización Completa)
 */
export class RouteService {
  /**
   * Crea una nueva hoja de ruta con facturas asignadas
   * @param data Datos de la hoja de ruta
   * @returns La hoja de ruta creada
   */
  async createHojaRuta(data: CreateHojaRutaInput): Promise<HojaRuta> {
    // Obtener empresa_id del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single();

    if (!perfil?.empresa_id) {
      throw new Error('Usuario sin empresa asociada');
    }

    // Obtener nombres de empleado y ruta para generar identificador
    const { data: empleado } = await supabase
      .from('empleados')
      .select('nombre, apellido')
      .eq('id', data.empleado_id)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    const { data: ruta } = await supabase
      .from('rutas')
      .select('nombre')
      .eq('id', data.ruta_id)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    if (!empleado || !ruta) {
      throw new Error('Empleado o ruta no encontrados');
    }

    // Generar identificador: "Jose Bani 20/03/2026"
    const fecha = new Date(data.fecha);
    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    const identificador = `${empleado.nombre} ${ruta.nombre} ${fechaFormateada}`;

    // Crear hoja de ruta
    const { data: hojaRuta, error: hojaError } = await supabase
      .from('hojas_ruta')
      .insert({
        empresa_id: perfil.empresa_id,
        empleado_id: data.empleado_id,
        ruta_id: data.ruta_id,
        fecha: data.fecha,
        identificador,
        monto_asignado_rdp: data.monto_asignado_rdp,
        estado: 'pendiente' as EstadoHojaRuta
      })
      .select()
      .single();

    if (hojaError) {
      throw new Error(`Error al crear hoja de ruta: ${hojaError.message}`);
    }

    // Agregar facturas
    if (data.facturas.length > 0) {
      const facturasToInsert = data.facturas.map(f => ({
        hoja_ruta_id: hojaRuta.id,
        numero: f.numero,
        monto: f.monto,
        moneda: f.moneda,
        estado_pago: f.estado_pago,
        estado_entrega: 'pendiente' as const
      }));

      const { error: facturasError } = await supabase
        .from('facturas_ruta')
        .insert(facturasToInsert);

      if (facturasError) {
        throw new Error(`Error al agregar facturas: ${facturasError.message}`);
      }
    }

    // Calcular y guardar balance inicial
    await this.calculateBalance(hojaRuta.id);

    return hojaRuta;
  }

  /**
   * Agrega una factura a una hoja de ruta existente
   * @param hojaRutaId ID de la hoja de ruta
   * @param factura Datos de la factura
   */
  async addFactura(
    hojaRutaId: string,
    factura: {
      numero: string;
      monto: number;
      moneda: Moneda;
      estado_pago: 'pendiente' | 'pagada';
    }
  ): Promise<void> {
    // Verificar que la hoja de ruta no esté cerrada
    const { data: hojaRuta } = await supabase
      .from('hojas_ruta')
      .select('estado')
      .eq('id', hojaRutaId)
      .single();

    if (hojaRuta?.estado === 'cerrada') {
      throw new Error('No se pueden agregar facturas a una hoja de ruta cerrada');
    }

    const { error } = await supabase
      .from('facturas_ruta')
      .insert({
        hoja_ruta_id: hojaRutaId,
        numero: factura.numero,
        monto: factura.monto,
        moneda: factura.moneda,
        estado_pago: factura.estado_pago,
        estado_entrega: 'pendiente'
      });

    if (error) {
      throw new Error(`Error al agregar factura: ${error.message}`);
    }

    // Recalcular balance
    await this.calculateBalance(hojaRutaId);
  }

  /**
   * Marca una factura como entregada
   * @param facturaId ID de la factura
   */
  async markFacturaEntregada(facturaId: string): Promise<void> {
    const { error } = await supabase
      .from('facturas_ruta')
      .update({
        estado_entrega: 'entregada',
        entregada_en: new Date().toISOString()
      })
      .eq('id', facturaId);

    if (error) {
      throw new Error(`Error al marcar factura como entregada: ${error.message}`);
    }

    // Obtener hoja_ruta_id para recalcular balance
    const { data: factura } = await supabase
      .from('facturas_ruta')
      .select('hoja_ruta_id')
      .eq('id', facturaId)
      .single();

    if (factura) {
      await this.calculateBalance(factura.hoja_ruta_id);
    }
  }

  /**
   * Marca una factura como cobrada con el monto recibido
   * @param facturaId ID de la factura
   * @param input Datos del cobro
   */
  async markFacturaCobrada(
    facturaId: string,
    input: MarkFacturaCobradaInput
  ): Promise<void> {
    const { error } = await supabase
      .from('facturas_ruta')
      .update({
        estado_pago: 'pagada',
        monto_cobrado: input.monto_cobrado,
        moneda_cobrada: input.moneda_cobrada,
        cobrada_en: new Date().toISOString()
      })
      .eq('id', facturaId);

    if (error) {
      throw new Error(`Error al marcar factura como cobrada: ${error.message}`);
    }

    // Obtener hoja_ruta_id para recalcular balance
    const { data: factura } = await supabase
      .from('facturas_ruta')
      .select('hoja_ruta_id')
      .eq('id', facturaId)
      .single();

    if (factura) {
      await this.calculateBalance(factura.hoja_ruta_id);
    }
  }

  /**
   * Registra un gasto en la hoja de ruta
   * @param hojaRutaId ID de la hoja de ruta
   * @param gasto Datos del gasto
   */
  async registerGasto(
    hojaRutaId: string,
    gasto: RegisterGastoInput
  ): Promise<void> {
    // Verificar que la hoja de ruta no esté cerrada
    const { data: hojaRuta } = await supabase
      .from('hojas_ruta')
      .select('estado')
      .eq('id', hojaRutaId)
      .single();

    if (hojaRuta?.estado === 'cerrada') {
      throw new Error('No se pueden registrar gastos en una hoja de ruta cerrada');
    }

    // Validar evidencia si es requerida
    if (gasto.evidencia_requerida && !gasto.evidencia_id) {
      throw new Error('Este tipo de gasto requiere evidencia fotográfica');
    }

    const { error } = await supabase
      .from('gastos_ruta')
      .insert({
        hoja_ruta_id: hojaRutaId,
        tipo: gasto.tipo,
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        moneda: gasto.moneda,
        evidencia_requerida: gasto.evidencia_requerida,
        evidencia_id: gasto.evidencia_id,
        registrado_en: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Error al registrar gasto: ${error.message}`);
    }

    // Recalcular balance
    await this.calculateBalance(hojaRutaId);
  }

  /**
   * Calcula el balance actual de una hoja de ruta
   * @param hojaRutaId ID de la hoja de ruta
   * @returns Balance calculado
   */
  async calculateBalance(hojaRutaId: string): Promise<BalanceRuta> {
    // Obtener monto asignado
    const { data: hojaRuta } = await supabase
      .from('hojas_ruta')
      .select('monto_asignado_rdp')
      .eq('id', hojaRutaId)
      .single();

    if (!hojaRuta) {
      throw new Error('Hoja de ruta no encontrada');
    }

    // Obtener facturas cobradas
    const { data: facturas } = await supabase
      .from('facturas_ruta')
      .select('monto_cobrado, moneda_cobrada')
      .eq('hoja_ruta_id', hojaRutaId)
      .eq('estado_pago', 'pagada')
      .not('monto_cobrado', 'is', null);

    // Calcular total de facturas por moneda
    let total_facturas_rdp = 0;
    let total_facturas_usd = 0;

    facturas?.forEach(f => {
      if (f.moneda_cobrada === 'RD$') {
        total_facturas_rdp += f.monto_cobrado || 0;
      } else if (f.moneda_cobrada === 'USD') {
        total_facturas_usd += f.monto_cobrado || 0;
      }
    });

    // Obtener gastos
    const { data: gastos } = await supabase
      .from('gastos_ruta')
      .select('monto, moneda')
      .eq('hoja_ruta_id', hojaRutaId);

    // Calcular total de gastos por moneda
    let total_gastos_rdp = 0;
    let total_gastos_usd = 0;

    gastos?.forEach(g => {
      if (g.moneda === 'RD$') {
        total_gastos_rdp += g.monto;
      } else if (g.moneda === 'USD') {
        total_gastos_usd += g.monto;
      }
    });

    // Calcular dinero disponible
    // Dinero disponible = Monto Asignado + Cobros - Gastos
    const dinero_disponible_rdp = hojaRuta.monto_asignado_rdp + total_facturas_rdp - total_gastos_rdp;
    const dinero_disponible_usd = total_facturas_usd - total_gastos_usd;

    const balance: BalanceRuta = {
      total_facturas_rdp,
      total_facturas_usd,
      total_gastos_rdp,
      total_gastos_usd,
      dinero_disponible_rdp,
      dinero_disponible_usd
    };

    // Guardar snapshot en historial
    await supabase
      .from('balance_ruta_historico')
      .insert({
        hoja_ruta_id: hojaRutaId,
        ...balance,
        timestamp: new Date().toISOString()
      });

    return balance;
  }

  /**
   * Cierra una hoja de ruta y crea registro en folder_diario
   * @param hojaRutaId ID de la hoja de ruta
   * @param input Montos físicos contados
   */
  async closeRuta(hojaRutaId: string, input: CloseRutaInput): Promise<void> {
    // Verificar permisos (Usuario_Completo)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, empresa_id')
      .eq('id', user.id)
      .single();

    if (perfil?.rol !== 'Usuario_Completo' && perfil?.rol !== 'Dueño') {
      throw new Error('Solo Usuario_Completo o Dueño pueden cerrar hojas de ruta');
    }

    // Verificar que la hoja no esté ya cerrada
    const { data: hojaRuta } = await supabase
      .from('hojas_ruta')
      .select('estado, fecha, empleado_id, ruta_id')
      .eq('id', hojaRutaId)
      .single();

    if (!hojaRuta) {
      throw new Error('Hoja de ruta no encontrada');
    }

    if (hojaRuta.estado === 'cerrada') {
      throw new Error('La hoja de ruta ya está cerrada');
    }

    // Calcular balance automático (para guardar snapshot final)
    await this.calculateBalance(hojaRutaId);

    // Obtener o crear folder_diario para la fecha
    const fechaLaboral = hojaRuta.fecha;
    
    let { data: folder } = await supabase
      .from('folders_diarios')
      .select('id')
      .eq('empresa_id', perfil.empresa_id)
      .eq('fecha_laboral', fechaLaboral)
      .single();

    // Si no existe folder para esa fecha, crearlo
    if (!folder) {
      // Obtener o crear semana laboral
      const { data: semana } = await supabase
        .from('semanas_laborales')
        .select('id')
        .eq('empresa_id', perfil.empresa_id)
        .lte('fecha_inicio', fechaLaboral)
        .gte('fecha_fin', fechaLaboral)
        .single();

      if (!semana) {
        throw new Error('No se encontró semana laboral para la fecha de la ruta');
      }

      const { data: nuevoFolder } = await supabase
        .from('folders_diarios')
        .insert({
          empresa_id: perfil.empresa_id,
          fecha_laboral: fechaLaboral,
          semana_laboral_id: semana.id,
          total_ingresos: 0,
          total_egresos: 0,
          balance_diario: 0,
          cerrado: false
        })
        .select('id')
        .single();

      folder = nuevoFolder;
    }

    if (!folder) {
      throw new Error('No se pudo crear o encontrar folder diario');
    }

    // Obtener nombres de empleado y ruta para el concepto
    const { data: empleado } = await supabase
      .from('empleados')
      .select('nombre, apellido')
      .eq('id', hojaRuta.empleado_id)
      .single();

    const { data: ruta } = await supabase
      .from('rutas')
      .select('nombre')
      .eq('id', hojaRuta.ruta_id)
      .single();

    const conceptoBase = `Cierre Ruta - ${empleado?.nombre || ''} ${ruta?.nombre || ''}`;

    // Crear registros de ingreso por cada moneda con monto > 0
    if (input.monto_fisico_rdp > 0) {
      await supabase
        .from('registros')
        .insert({
          empresa_id: perfil.empresa_id,
          folder_diario_id: folder.id,
          tipo: 'ingreso',
          concepto: `${conceptoBase} (RD$)`,
          empleado: `${empleado?.nombre || ''} ${empleado?.apellido || ''}`,
          ruta: ruta?.nombre || '',
          monto: input.monto_fisico_rdp,
          creado_por: user.id
        });
    }

    if (input.monto_fisico_usd > 0) {
      await supabase
        .from('registros')
        .insert({
          empresa_id: perfil.empresa_id,
          folder_diario_id: folder.id,
          tipo: 'ingreso',
          concepto: `${conceptoBase} (USD)`,
          empleado: `${empleado?.nombre || ''} ${empleado?.apellido || ''}`,
          ruta: ruta?.nombre || '',
          monto: input.monto_fisico_usd,
          creado_por: user.id
        });
    }

    // Marcar hoja de ruta como cerrada
    const { error: closeError } = await supabase
      .from('hojas_ruta')
      .update({
        estado: 'cerrada' as EstadoHojaRuta,
        cerrada_por: user.id,
        cerrada_en: new Date().toISOString()
      })
      .eq('id', hojaRutaId);

    if (closeError) {
      throw new Error(`Error al cerrar hoja de ruta: ${closeError.message}`);
    }
  }

  /**
   * Obtiene una hoja de ruta por ID
   * @param hojaRutaId ID de la hoja de ruta
   * @returns La hoja de ruta con sus facturas y gastos
   */
  async getHojaRutaById(hojaRutaId: string): Promise<HojaRuta & { 
    facturas: FacturaRuta[];
    gastos: GastoRuta[];
    balance: BalanceRuta;
  }> {
    const { data: hojaRuta, error } = await supabase
      .from('hojas_ruta')
      .select('*')
      .eq('id', hojaRutaId)
      .single();

    if (error || !hojaRuta) {
      throw new Error('Hoja de ruta no encontrada');
    }

    // Obtener facturas
    const { data: facturas } = await supabase
      .from('facturas_ruta')
      .select('*')
      .eq('hoja_ruta_id', hojaRutaId)
      .order('created_at');

    // Obtener gastos
    const { data: gastos } = await supabase
      .from('gastos_ruta')
      .select('*')
      .eq('hoja_ruta_id', hojaRutaId)
      .order('registrado_en');

    // Calcular balance actual
    const balance = await this.calculateBalance(hojaRutaId);

    return {
      ...hojaRuta,
      facturas: facturas || [],
      gastos: gastos || [],
      balance
    };
  }

  /**
   * Obtiene hojas de ruta asignadas a un empleado
   * @param empleadoId ID del empleado
   * @returns Lista de hojas de ruta del empleado
   */
  async getHojasRutaByEmpleado(empleadoId: string): Promise<HojaRuta[]> {
    const { data: hojas, error } = await supabase
      .from('hojas_ruta')
      .select('*')
      .eq('empleado_id', empleadoId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener hojas de ruta: ${error.message}`);
    }

    return hojas || [];
  }

  /**
   * Obtiene todas las hojas de ruta de la empresa del usuario actual
   * @returns Lista de hojas de ruta
   */
  async getAllHojasRuta(): Promise<HojaRuta[]> {
    const { data: hojas, error } = await supabase
      .from('hojas_ruta')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener hojas de ruta: ${error.message}`);
    }

    return hojas || [];
  }
}

// Exportar instancia singleton
export const routeService = new RouteService();
