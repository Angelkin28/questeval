/** Tipos alineados a las tablas de Supabase (README_DATABASE.md) y MongoDB API (PascalCase) */

export interface Rol {
  id: number
  nombre: string
  descripcion: string | null
}

export interface Usuario {
  id: string
  nombre_completo: string | null
  email: string | null
  rol_id: number | null
  avatar_url: string | null
  creado_en: string
  actualizado_en: string
}

/** Rol tal como viene del join en usuarios (puede ser parcial) */
export interface RolJoined {
  nombre?: string
  descripcion?: string | null
}

export interface UsuarioConRol extends Usuario {
  roles: Rol | RolJoined | null
}

export interface Grupo {
  id: string // Mongo ID is string
  nombre: string
  Name?: string
  codigo_acceso: string | null
  AccessCode?: string
  creado_en: string
}

export interface MiembroGrupo {
  id: string // Mongo ID
  usuario_id: string
  UserId?: string
  grupo_id: string // Mongo ID
  GroupId?: string
  fecha_union: string
  grupos?: Grupo
}

export interface Proyecto {
  id: string
  nombre: string
  Name?: string
  descripcion: string | null
  Description?: string
  grupo_id: string // Mongo ID
  GroupId?: string
  estado: string
  Status?: string
  creado_en: string
  actualizado_en: string
}

export interface Criterio {
  id: string // Mongo ID
  nombre: string
  Name?: string
  descripcion: string | null
  Description?: string
  puntuacion_maxima: number
  MaxScore?: number
}

export interface DetalleEvaluacion {
  // Now embedded in Evaluation in Mongo, but kept as interface for frontend components
  id?: string
  CriterionId?: string
  evaluacion_id?: string
  criterio_id?: string
  puntuacion_obtenida: number
  Score?: number
  criterios?: Criterio
  CriterionName?: string
}

export interface Evaluacion {
  id: string
  proyecto_id: string
  ProjectId?: string
  evaluador_id: string | null
  EvaluatorId?: string
  calificacion_final: number
  FinalScore?: number
  fecha_evaluacion: string
  actualizado_en: string

  // Embedded details
  Details?: DetalleEvaluacion[]
}

export interface Retroalimentacion {
  id: string
  evaluacion_id: string
  EvaluationId?: string
  comentario: string
  Comment?: string
  es_publico: boolean
  IsPublic?: boolean
  creado_en: string
}
