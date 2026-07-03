import { supabase } from './supabase';
import type {
  ActivityLog,
  Cotisation,
  DashboardStats,
  Document,
  Mandataire,
  Notification,
  Profile,
  Structure,
} from '../types';

export async function fetchStructures(): Promise<Structure[]> {
  const { data, error } = await supabase
    .from('structures')
    .select('*, focal:profiles!focal_id(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Structure[]) ?? [];
}

export async function fetchStructure(id: string): Promise<Structure | null> {
  const { data, error } = await supabase
    .from('structures')
    .select('*, focal:profiles!focal_id(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Structure | null;
}

export async function createStructure(input: Omit<Structure, 'id' | 'created_at' | 'updated_at' | 'focal' | 'mandataire_count'>): Promise<Structure> {
  const { data, error } = await supabase.from('structures').insert(input).select().single();
  if (error) throw error;
  return data as Structure;
}

export async function updateStructure(id: string, input: Partial<Structure>): Promise<Structure> {
  const { data, error } = await supabase.from('structures').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Structure;
}

export async function deleteStructure(id: string): Promise<void> {
  const { error } = await supabase.from('structures').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMandataires(structureId?: string): Promise<Mandataire[]> {
  let query = supabase
    .from('mandataires')
    .select('*, structure:structures(*)')
    .order('created_at', { ascending: false });
  if (structureId) query = query.eq('structure_id', structureId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Mandataire[]) ?? [];
}

export async function fetchMandataire(id: string): Promise<Mandataire | null> {
  const { data, error } = await supabase
    .from('mandataires')
    .select('*, structure:structures(*), documents(*), cotisations(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Mandataire | null;
}

export async function createMandataire(
  input: Omit<Mandataire, 'id' | 'created_at' | 'updated_at' | 'structure' | 'documents' | 'cotisations'>
): Promise<Mandataire> {
  const { data, error } = await supabase.from('mandataires').insert(input).select().single();
  if (error) throw error;
  return data as Mandataire;
}

export async function updateMandataire(id: string, input: Partial<Mandataire>): Promise<Mandataire> {
  const { data, error } = await supabase.from('mandataires').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Mandataire;
}

export async function deleteMandataire(id: string): Promise<void> {
  const { error } = await supabase.from('mandataires').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCotisations(filters?: { mandataireId?: string; structureId?: string }): Promise<Cotisation[]> {
  let query = supabase
    .from('cotisations')
    .select('*, mandataire:mandataires(id, matricule, nom, postnom, prenom, structure:structures(id, name))')
    .order('date_paiement', { ascending: false });
  if (filters?.mandataireId) query = query.eq('mandataire_id', filters.mandataireId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Cotisation[]) ?? [];
}

export async function createCotisation(
  input: Omit<Cotisation, 'id' | 'created_at' | 'mandataire'>
): Promise<Cotisation> {
  const { data, error } = await supabase.from('cotisations').insert(input).select().single();
  if (error) throw error;
  return data as Cotisation;
}

export async function updateCotisation(id: string, input: Partial<Cotisation>): Promise<Cotisation> {
  const { data, error } = await supabase.from('cotisations').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Cotisation;
}

export async function deleteCotisation(id: string): Promise<void> {
  const { error } = await supabase.from('cotisations').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

export async function updateProfile(id: string, input: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(input).eq('id', id);
  if (error) throw error;
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(id, full_name, role)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as ActivityLog[]) ?? [];
}

export async function logActivity(action: string, entityType?: string, details?: Record<string, unknown>): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from('activity_logs').insert({
    user_id: userData.user.id,
    action,
    entity_type: entityType,
    details,
  });
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Notification[]) ?? [];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [structures, mandataires, cotisations] = await Promise.all([
    fetchStructures(),
    fetchMandataires(),
    fetchCotisations(),
  ]);

  const totalCotisations = cotisations.reduce((sum, c) => sum + Number(c.montant), 0);
  const mandatairesActifs = mandataires.filter((m) => m.statut === 'actif').length;

  const statutMap = new Map<string, number>();
  mandataires.forEach((m) => {
    statutMap.set(m.statut, (statutMap.get(m.statut) ?? 0) + 1);
  });

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentYear = new Date().getFullYear();
  const cotisationsParMois = monthLabels.map((mois, i) => {
    const montant = cotisations
      .filter((c) => {
        const d = new Date(c.date_paiement);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      })
      .reduce((sum, c) => sum + Number(c.montant), 0);
    return { mois, montant };
  });

  const typeMap = new Map<string, number>();
  cotisations.forEach((c) => {
    typeMap.set(c.type, (typeMap.get(c.type) ?? 0) + Number(c.montant));
  });

  const provinceMap = new Map<string, number>();
  mandataires.forEach((m) => {
    if (m.province_origine) {
      provinceMap.set(m.province_origine, (provinceMap.get(m.province_origine) ?? 0) + 1);
    }
  });

  const currentMonth = new Date().getMonth();
  const retardataires = mandataires.filter((m) => {
    if (m.statut !== 'actif') return false;
    const hasThisMonth = cotisations.some((c) => {
      const d = new Date(c.date_paiement);
      return c.mandataire_id === m.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return !hasThisMonth;
  }).length;

  return {
    totalStructures: structures.length,
    totalMandataires: mandataires.length,
    totalCotisations,
    tauxCotisation: mandataires.length > 0 ? Math.round((mandatairesActifs / mandataires.length) * 100) : 0,
    mandatairesActifs,
    mandatairesParStatut: Array.from(statutMap.entries()).map(([statut, count]) => ({ statut, count })),
    cotisationsParMois,
    cotisationsParType: Array.from(typeMap.entries()).map(([type, montant]) => ({ type, montant })),
    mandatairesParProvince: Array.from(provinceMap.entries())
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    retardataires,
  };
}

export async function uploadDocument(
  mandataireId: string,
  file: File,
  type: Document['type'],
  uploadedBy: string
): Promise<Document> {
  const ext = file.name.split('.').pop();
  const fileName = `${mandataireId}/${type}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
  const { data, error } = await supabase
    .from('documents')
    .insert({
      mandataire_id: mandataireId,
      type,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}
