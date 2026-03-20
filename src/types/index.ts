// Interfaces TypeScript del diseño

export interface Evidencia {
  id: string;
  empresa_id?: string;
  registro_id?: string;
  deposito_id?: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
}

export interface Registro {
  id: string;
  empresa_id?: string;
  folder_diario_id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  empleado: string;
  ruta: string;
  monto: number;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderDiario {
  id: string;
  empresa_id?: string;
  fecha_laboral: string;
  semana_laboral_id: string;
  total_ingresos: number;
  total_egresos: number;
  balance_diario: number;
  cerrado: boolean;
  cerrado_por: string | null;
  cerrado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deposito {
  id: string;
  empresa_id?: string;
  semana_id: string;
  folder_id: string | null;
  monto: number;
  fecha_deposito: string;
  banco: string | null;
  nota: string | null;
  evidencias: Evidencia[];
  registrado_por: string;
}

export interface SemanaLaboral {
  id: string;
  empresa_id?: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_ingresos: number;
  total_egresos: number;
  balance_neto: number;
  total_depositos: number;
  saldo_disponible: number;
  created_at: string;
  updated_at: string;
}

export interface Empleado {
  id: string;
  empresa_id?: string;
  nombre: string;
  apellido: string;
  activo: boolean;
}

export interface Ruta {
  id: string;
  empresa_id?: string;
  nombre: string;
  activo: boolean;
}

export interface Concepto {
  id: string;
  empresa_id?: string;
  descripcion: string;
  tipo: 'ingreso' | 'egreso' | 'ambos';
  activo: boolean;
}

export interface Perfil {
  id: string;
  empresa_id?: string;
  nombre: string;
  rol: 
    | 'Usuario_Ingresos' 
    | 'Usuario_Egresos' 
    | 'Usuario_Completo' 
    | 'Dueño'
    | 'Super_Admin'
    | 'Encargado_Almacén'
    | 'Secretaria'
    | 'Empleado_Ruta';
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
}

// Multi-Tenant Platform Types

export type NivelAutomatizacion = 'parcial' | 'completa';
export type Moneda = 'RD$' | 'USD';
export type EstadoHojaRuta = 'pendiente' | 'en_progreso' | 'completada' | 'cerrada';
export type EstadoPago = 'pendiente' | 'pagada';
export type EstadoEntrega = 'pendiente' | 'entregada';
export type TipoGasto = 'fijo' | 'peaje' | 'combustible' | 'inesperado';

export interface Empresa {
  id: string;
  nombre: string;
  nivel_automatizacion: NivelAutomatizacion;
  logo_url?: string;
  activa: boolean;
  limite_storage_mb: number;
  created_at: string;
  updated_at: string;
}

export interface HojaRuta {
  id: string;
  empresa_id: string;
  empleado_id: string;
  ruta_id: string;
  fecha: string;
  identificador: string;
  monto_asignado_rdp: number;
  estado: EstadoHojaRuta;
  cerrada_por?: string;
  cerrada_en?: string;
  created_at: string;
  updated_at: string;
}

export interface FacturaRuta {
  id: string;
  hoja_ruta_id: string;
  numero: string;
  monto: number;
  moneda: Moneda;
  estado_pago: EstadoPago;
  estado_entrega: EstadoEntrega;
  monto_cobrado?: number;
  moneda_cobrada?: Moneda;
  entregada_en?: string;
  cobrada_en?: string;
  created_at: string;
  updated_at: string;
}

export interface GastoRuta {
  id: string;
  hoja_ruta_id: string;
  tipo: TipoGasto;
  descripcion?: string;
  monto: number;
  moneda: Moneda;
  evidencia_requerida: boolean;
  evidencia_id?: string;
  registrado_en: string;
  created_at: string;
}

export interface BalanceRuta {
  total_facturas_rdp: number;
  total_facturas_usd: number;
  total_gastos_rdp: number;
  total_gastos_usd: number;
  dinero_disponible_rdp: number;
  dinero_disponible_usd: number;
}

export interface AuditLog {
  id: string;
  empresa_id?: string;
  usuario_id?: string;
  accion: string;
  recurso: string;
  detalles?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  exitoso: boolean;
  created_at: string;
}

// Input types para servicios
export interface CreateEmpresaInput {
  nombre: string;
  nivel_automatizacion: NivelAutomatizacion;
  logo_url?: string;
  limite_storage_mb?: number;
}

export interface UpdateEmpresaInput {
  nombre?: string;
  nivel_automatizacion?: NivelAutomatizacion;
  logo_url?: string;
  limite_storage_mb?: number;
  activa?: boolean;
}

export interface EmpresaStats {
  total_usuarios: number;
  storage_usado_mb: number;
  ultima_actividad: Date | null;
  nivel_automatizacion: NivelAutomatizacion;
}

export interface CreateUserInput {
  email: string;
  password: string;
  nombre: string;
  rol: Perfil['rol'];
  empresa_id: string;
}
