// src/db/notifications.js — notification feed + realtime subscription
import { supabase } from '../supabase';

export async function fetchNotifications({ limit = 50 } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.warn('[notifications]', error.message); return []; }
  return data ?? [];
}

export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id).is('read_at', null);
  if (error) console.warn('[notifications:mark-read]', error.message);
}

export async function markRead(id) {
  const { error } = await supabase.from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.warn('[notifications:mark-one]', error.message);
}

/**
 * Subscribe to realtime new-notification events for the current user.
 * Returns an unsubscribe function.
 */
export function subscribeNotifications(onInsert) {
  const channel = supabase
    .channel('notifications_stream')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => onInsert?.(payload.new)
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
