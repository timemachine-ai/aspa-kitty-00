import { supabase } from '../../lib/supabase';
import { GroupChat, GroupChatMessage, GroupChatParticipant, GroupChatInvite } from '../../types/groupChat';
import { AI_PERSONAS } from '../../config/constants';

// Generate a short shareable ID
function generateShareId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new group chat from an existing session
export async function createGroupChat(
  sessionId: string,
  userId: string,
  userNickname: string,
  chatName: string,
  persona: keyof typeof AI_PERSONAS
): Promise<string | null> {
  try {
    const shareId = generateShareId();

    // Create group chat record
    const { data, error } = await supabase
      .from('group_chats')
      .insert({
        id: shareId,
        session_id: sessionId,
        owner_id: userId,
        owner_nickname: userNickname,
        name: chatName,
        persona,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as first participant
    await supabase.from('group_chat_participants').insert({
      group_chat_id: shareId,
      user_id: userId,
      nickname: userNickname,
      is_owner: true,
    });

    return shareId;
  } catch (error) {
    console.error('Failed to create group chat:', error);
    return null;
  }
}

// Get group chat info (for invite preview)
export async function getGroupChatInvite(chatId: string): Promise<GroupChatInvite | null> {
  try {
    const { data: chat, error } = await supabase
      .from('group_chats')
      .select('*')
      .eq('id', chatId)
      .eq('is_active', true)
      .single();

    if (error || !chat) return null;

    const { count } = await supabase
      .from('group_chat_participants')
      .select('*', { count: 'exact', head: true })
      .eq('group_chat_id', chatId);

    return {
      chat_id: chat.id,
      chat_name: chat.name,
      owner_nickname: chat.owner_nickname,
      persona: chat.persona as keyof typeof AI_PERSONAS,
      participant_count: count || 1,
    };
  } catch (error) {
    console.error('Failed to get group chat invite:', error);
    return null;
  }
}

// Join a group chat
export async function joinGroupChat(
  chatId: string,
  userId: string,
  userNickname: string,
  avatarUrl?: string
): Promise<boolean> {
  try {
    // Check if already a participant
    const { data: existing } = await supabase
      .from('group_chat_participants')
      .select('id')
      .eq('group_chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (existing) return true; // Already joined

    const { error } = await supabase
      .from('group_chat_participants')
      .insert({
        group_chat_id: chatId,
        user_id: userId,
        nickname: userNickname,
        avatar_url: avatarUrl,
        is_owner: false,
      });

    return !error;
  } catch (error) {
    console.error('Failed to join group chat:', error);
    return false;
  }
}

// Get full group chat with messages and participants
export async function getGroupChat(chatId: string): Promise<GroupChat | null> {
  try {
    const { data: chat, error: chatError } = await supabase
      .from('group_chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) return null;

    // Get participants
    const { data: participants } = await supabase
      .from('group_chat_participants')
      .select('*')
      .eq('group_chat_id', chatId)
      .order('joined_at', { ascending: true });

    // Get messages
    const { data: messages } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('group_chat_id', chatId)
      .order('created_at', { ascending: true });

    return {
      id: chat.id,
      name: chat.name,
      owner_id: chat.owner_id,
      owner_nickname: chat.owner_nickname,
      persona: chat.persona as keyof typeof AI_PERSONAS,
      is_active: chat.is_active,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      participants: (participants || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        nickname: p.nickname,
        avatar_url: p.avatar_url,
        joined_at: p.joined_at,
        is_owner: p.is_owner,
      })),
      messages: (messages || []).map(m => ({
        id: new Date(m.created_at).getTime(),
        content: m.content,
        isAI: m.role === 'assistant',
        hasAnimated: true,
        sender_id: m.sender_id,
        sender_nickname: m.sender_nickname,
        sender_avatar: m.sender_avatar,
        inputImageUrls: m.images,
        audioUrl: m.audio_url,
        thinking: m.reasoning,
      })),
    };
  } catch (error) {
    console.error('Failed to get group chat:', error);
    return null;
  }
}

// Send a message to group chat
export async function sendGroupChatMessage(
  chatId: string,
  content: string,
  senderId: string,
  senderNickname: string,
  senderAvatar?: string,
  isAI: boolean = false,
  images?: string[],
  audioUrl?: string,
  reasoning?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('group_chat_messages')
      .insert({
        group_chat_id: chatId,
        content,
        role: isAI ? 'assistant' : 'user',
        sender_id: isAI ? null : senderId,
        sender_nickname: isAI ? 'TimeMachine' : senderNickname,
        sender_avatar: senderAvatar,
        images,
        audio_url: audioUrl,
        reasoning,
      });

    return !error;
  } catch (error) {
    console.error('Failed to send group chat message:', error);
    return false;
  }
}

// Check if user is participant
export async function isGroupChatParticipant(chatId: string, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('group_chat_participants')
      .select('id')
      .eq('group_chat_id', chatId)
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Disable group chat (owner only)
export async function disableGroupChat(chatId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('group_chats')
      .update({ is_active: false })
      .eq('id', chatId)
      .eq('owner_id', userId);

    return !error;
  } catch (error) {
    console.error('Failed to disable group chat:', error);
    return false;
  }
}

// Subscribe to group chat messages (real-time)
export function subscribeToGroupChat(
  chatId: string,
  onMessage: (message: GroupChatMessage) => void,
  onParticipantJoin: (participant: GroupChatParticipant) => void
) {
  // Subscribe to new messages
  const messagesChannel = supabase
    .channel(`group_chat_messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chat_messages',
        filter: `group_chat_id=eq.${chatId}`,
      },
      (payload) => {
        const m = payload.new as any;
        onMessage({
          id: new Date(m.created_at).getTime(),
          content: m.content,
          isAI: m.role === 'assistant',
          hasAnimated: false,
          sender_id: m.sender_id,
          sender_nickname: m.sender_nickname,
          sender_avatar: m.sender_avatar,
          inputImageUrls: m.images,
          audioUrl: m.audio_url,
          thinking: m.reasoning,
        });
      }
    )
    .subscribe();

  // Subscribe to new participants
  const participantsChannel = supabase
    .channel(`group_chat_participants:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chat_participants',
        filter: `group_chat_id=eq.${chatId}`,
      },
      (payload) => {
        const p = payload.new as any;
        onParticipantJoin({
          id: p.id,
          user_id: p.user_id,
          nickname: p.nickname,
          avatar_url: p.avatar_url,
          joined_at: p.joined_at,
          is_owner: p.is_owner,
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    messagesChannel.unsubscribe();
    participantsChannel.unsubscribe();
  };
}
