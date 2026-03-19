// Interfaces TypeScript del diseño

export interface Evidencia {
  id: string;
  registro_id?: string;
  deposito_id?: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
}

export interface Registro {
  id: string;
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
  nombre: string;
  apellido: string;
  activo: boolean;
}

export interface Ruta {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Concepto {
  id: string;
  descripcion: string;
  tipo: 'ingreso' | 'egreso' | 'ambos';
  activo: boolean;
}

export interface Perfil {
  id: string;
  nombre: string;
  rol: 'Usuario_Ingresos' | 'Usuario_Egresos' | 'Usuario_Completo' | 'Dueño';
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
}
