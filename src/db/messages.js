// src/db/messages.js — conversations + messages + realtime
import { supabase } from '../supabase';

export async function fetchConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      conversation_id, last_read_at,
      conversation:conversations!conversation_id(id, created_at)
    `)
    .eq('user_id', user.id);
  if (error) { console.warn('[conversations]', error.message); return []; }
  return data || [];
}

export async function fetchMessages(conversationId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, sender:profiles!sender_id(display_name, handle, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) { console.warn('[messages]', error.message); return []; }
  return data || [];
}

export async function sendMessage(conversationId, body) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to message');
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  }).select('*, sender:profiles!sender_id(display_name, handle, avatar_url)').single();
  if (error) throw error;
  return data;
}

/** Start (or reuse) a 1:1 conversation with another user. */
export async function openDirectConversation(otherUserId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first');
  // Naive: always create a new conversation. (For dedup, add a unique index on sorted member pair.)
  const { data: conv, error } = await supabase.from('conversations').insert({}).select('id').single();
  if (error) throw error;
  const rows = [
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ];
  const { error: err2 } = await supabase.from('conversation_members').insert(rows);
  if (err2) throw err2;
  return conv.id;
}

export function subscribeMessages(conversationId, onNew) {
  const channel = supabase
    .channel(`msg:${conversationId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      payload => onNew?.(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
