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

export interface Oficina {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string;
  activo: boolean;
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
  created_at?: string;
  updated_at?: string;
}

export interface CampanaInventario {
  id: number;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ACTIVA' | 'CERRADA';
}
