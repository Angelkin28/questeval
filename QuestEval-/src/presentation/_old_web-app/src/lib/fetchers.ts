import { supabase } from './supabase'
import api from './api'
import type { UsuarioConRol, Grupo, Proyecto, Evaluacion, DetalleEvaluacion, Retroalimentacion } from '../types/db'

// Auth still via Supabase for now, but User profile data might be in Mongo? 
// For this step, I will keep User fetch from Supabase if the user table wasn't fully migrated or if we are syncing.
// However, the request was "cambia la base de datos maneja mongo db".
// If users are in Mongo, we should fetch from there. But Auth state is Supabase.
// Let's assume for now we fetch the "Profile" from Mongo using the Auth ID.
// But the C# API didn't implement UsersController yet (only Membership).
// So I will leave getUsuarioWithRol as Supabase for this specific transition step 
// until we clarify if Users table also moved 100% to Mongo or just the business data.
// The Verification Script used "user-uuid-123", implying external ID storage.
export async function getUsuarioWithRol(uid: string): Promise<UsuarioConRol | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, roles(nombre, descripcion)')
    .eq('id', uid)
    .maybeSingle()
  if (error) {
    // Fallback or ignore if Supabase user table is gone
    console.warn("Supabase User Fetch Error", error);
    return null;
  }
  return data as UsuarioConRol | null
}

export async function getGruposDelAlumno(usuarioId: string): Promise<Grupo[]> {
  // In Mongo: Memberships collection has UseId + GroupId. 
  // But our API /memberships returns ALL. We need a filter endpoint or client-side filter (inefficient but works for prototype).
  // TODO: Add GetGroupsByUserId endpoint to C# API.
  // For now, let's assume we fetch all memberships and filter.
  const { data: memberships } = await api.get<any[]>('/memberships');
  const myMemberships = memberships.filter((m: any) => m.UserId === usuarioId);

  if (myMemberships.length === 0) return [];

  // Fetch all groups to map names (Inefficient, need optimized API)
  const { data: allGroups } = await api.get<any[]>('/groups');

  return allGroups
    .filter((g: any) => myMemberships.some((m: any) => m.GroupId === g.Id))
    .map((g: any) => ({
      id: g.Id,
      nombre: g.Name,
      codigo_acceso: g.AccessCode,
      creado_en: g.CreatedAt
    }));
}

export async function getProyectosDelGrupo(grupoId: number | string): Promise<Proyecto[]> {
  const { data } = await api.get<any[]>('/projects');
  // Client side filter
  return data
    .filter((p: any) => String(p.GroupId) === String(grupoId))
    .map((p: any) => ({
      id: p.Id,
      nombre: p.Name,
      descripcion: p.Description,
      grupo_id: p.GroupId,
      estado: p.Status,
      creado_en: p.CreatedAt,
      actualizado_en: p.UpdatedAt
    }));
}

export async function getEvaluacionPorProyecto(proyectoId: string): Promise<Evaluacion | null> {
  const { data } = await api.get<any[]>('/evaluations');
  const found = data.find((e: any) => e.ProjectId === proyectoId);

  if (!found) return null;

  return {
    id: found.Id,
    proyecto_id: found.ProjectId,
    evaluador_id: found.EvaluatorId,
    calificacion_final: found.FinalScore,
    fecha_evaluacion: found.CreatedAt, // Using CreatedAt as date
    actualizado_en: found.UpdatedAt,
    Details: found.Details?.map((d: any) => ({
      // internal mapping for Details if needed
      CriterionId: d.CriterionId,
      Score: d.Score,
      CriterionName: d.CriterionName,
      // Map to interface expectations if needed
      id: d.CriterionId,
      evaluacion_id: found.Id,
      criterio_id: d.CriterionId,
      puntuacion_obtenida: d.Score,
    }))
  };
}

export async function getDetalleEvaluacionConCriterios(evaluacionId: string): Promise<DetalleEvaluacion[]> {
  // In Mongo, details are embedded in Evaluation.
  const { data } = await api.get<any[]>('/evaluations');
  const evaluation = data.find((e: any) => e.Id === evaluacionId);

  if (!evaluation || !evaluation.Details) return [];

  return evaluation.Details.map((d: any) => ({
    id: d.CriterionId, // Mapping for compatibility
    evaluacion_id: evaluacionId,
    criterio_id: d.CriterionId,
    puntuacion_obtenida: d.Score,
    criterios: {
      id: d.CriterionId,
      nombre: d.CriterionName,
      descripcion: '',
      puntuacion_maxima: 0 // Snapshot didn't save max score?
    }
  }));
}

export async function getRetroalimentacionPublica(evaluacionId: string): Promise<Retroalimentacion[]> {
  const { data } = await api.get<any[]>('/feedback');
  return data
    .filter((f: any) => f.EvaluationId === evaluacionId && f.IsPublic)
    .map((f: any) => ({
      id: f.Id,
      evaluacion_id: f.EvaluationId,
      comentario: f.Comment,
      es_publico: f.IsPublic,
      creado_en: f.CreatedAt
    }));
}
