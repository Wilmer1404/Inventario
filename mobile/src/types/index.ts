export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export type UserRole = 'ADMIN' | 'INVENTARIADOR' | 'CONSULTA';

export interface User {
  id: number;
  name: string;
  email: string;
  dni: string;
  rol: UserRole;
  activo: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface Oficina {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string;
  activo?: boolean;
}

export interface Trabajador {
  id: number;
  dni: string;
  nombre_completo: string;
  cargo: string;
  oficina_id?: number;
  oficina?: Oficina;
  activo?: boolean;
}

export type TipoGestionBien = 'ACTIVO_UNICO' | 'CONSUMIBLE';
export type EstadoConservacion = 'BUENO' | 'REGULAR' | 'MALO' | 'EN_REPARACION' | 'BAJA';
export type EstadoInventario = 'INVENTARIADO' | 'PENDIENTE' | 'FALTANTE';

export interface BienVinculadoResumen {
  id: number;
  codigo_qr: string;
  nombre: string;
  foto_url?: string | null;
  estado_inventario_actual: EstadoInventario;
}

export interface UltimaVerificacion {
  id?: number;
  fecha: string;
  estado: string;
  usuario?: string;
  observacion?: string | null;
}

export interface Bien {
  id: number;
  codigo_qr: string;
  codigo_patrimonial?: string | null;
  tipo_gestion: TipoGestionBien;
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  numero_serie?: string | null;
  estado_conservacion: EstadoConservacion;
  oficina_id?: number;
  oficina?: Oficina;
  trabajador_id?: number | null;
  trabajador?: Trabajador | null;
  foto_url?: string | null;
  observaciones?: string | null;
  estado_inventario_actual?: EstadoInventario;
  ultima_verificacion?: UltimaVerificacion | null;
  otros_bienes_vinculados?: BienVinculadoResumen[];
  created_at?: string;
  updated_at?: string;
}

export interface EscaneoReciente {
  id: number;
  bien_id: number;
  codigo_qr: string;
  nombre: string;
  categoria: string;
  foto_url?: string | null;
  oficina?: string;
  estado_verificado: string;
  fecha_verificacion: string;
}

export interface CampanaInventario {
  id: number;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'CERRADA';
  total_bienes?: number;
  inventariados?: number;
  pendientes?: number;
  faltantes?: number;
  porcentaje_avance?: number;
  escaneos_recientes?: EscaneoReciente[];
}

export interface VerificacionInventario {
  id: number;
  campana_id: number;
  bien_id: number;
  user_id: number;
  estado_verificado: string;
  observacion?: string | null;
  fecha_verificacion: string;
}
