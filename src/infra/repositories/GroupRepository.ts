import { supabase } from '../supabase/client';
import { Group } from '@/core/entities/group';

export class GroupRepository {
  private table = 'groups';

  async findById(id: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Group;
  }

  async findBySlug(slug: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data as Group;
  }

  async update(id: string, updates: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Group;
  }

  async findAllByOwner(ownerId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as Group[];
  }

  async verifyPassword(idOrSlug: string, password: string): Promise<boolean> {
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const queryField = isUuid ? 'id' : 'slug';

    const { data, error } = await supabase
      .from(this.table)
      .select('invite_password')
      .eq(queryField, idOrSlug)
      .single();

    if (error || !data) return false;
    return data.invite_password === password;
  }

  async create(group: Omit<Group, 'id' | 'created_at'>): Promise<Group> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data as Group;
  }
}
