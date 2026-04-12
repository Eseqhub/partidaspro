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

  async verifyPassword(groupId: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.table)
      .select('invite_password')
      .eq('id', groupId)
      .single();

    if (error || !data) return false;
    return data.invite_password === password;
  }
}
