'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { type RealtimeChannel, createClient } from '@supabase/supabase-js';
import { sendMessageAction, getOrCreateDMThreadAction } from '@/app/actions/messages';
import { Plus } from 'lucide-react';

// Initialize Supabase client with public URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface Thread {
  id: string;
  name: string;
  isPrivate: boolean;
  members: Array<{
    userId: string;
    name: string;
    avatar: string | null;
  }>;
  lastMessage: string | null;
  lastMessageAt: Date;
}

interface Neighbor {
  id: string;
  name: string | null;
  avatar: string | null;
}

interface MessagingClientProps {
  threads: Thread[];
  currentUserId: string;
  neighbors: Neighbor[];
}

export function MessagingClient({ threads, currentUserId, neighbors }: MessagingClientProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  // Local threads list to support re-ordering and adding DMs on the fly
  const [localThreads, setLocalThreads] = useState<Thread[]>(threads);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync threads props with local state
  useEffect(() => {
    setLocalThreads(threads);
  }, [threads]);

  // Task 6: Fetch messages for the active thread when selected
  useEffect(() => {
    if (!activeThreadId) return;

    // Reset messages for thread load
    setMessages([]);
    setOptimisticMessages([]);

    fetch(`/api/messages/${activeThreadId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          // Convert date strings to Date objects
          const formatted = data.messages.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt)
          }));
          setMessages(formatted);
          setTimeout(() => scrollToBottom(), 50);
        }
      })
      .catch(err => console.error('[MessagingClient] Fetch error:', err));
  }, [activeThreadId]);

  // Task 6: Subscribe globally to Message inserts to handle real-time unread counts and sorting
  useEffect(() => {
    if (!supabase) return;

    // Listen to all inserts on the Message table
    const channel = supabase
      .channel('chat-global-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message'
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Verify if the message is for a thread the current user has access to
          const threadIndex = localThreads.findIndex(t => t.id === newMessage.groupId);
          if (threadIndex === -1 && !threads.some(t => t.id === newMessage.groupId)) return;

          const msgDate = new Date(newMessage.createdAt);

          // 1. Re-order localThreads list and update last message information
          setLocalThreads(prev => {
            const updated = prev.map(t => {
              if (t.id === newMessage.groupId) {
                return {
                  ...t,
                  lastMessage: newMessage.content,
                  lastMessageAt: msgDate
                };
              }
              return t;
            });
            // Re-sort by lastMessageAt descending
            return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
          });

          // 2. Distribute message content to active viewport, or increment unread counts
          if (newMessage.groupId === activeThreadId) {
            if (newMessage.senderId === currentUserId) {
              // De-duplicate our optimistic state message
              setOptimisticMessages(prev =>
                prev.filter(m => m.content !== newMessage.content)
              );
              return;
            }

            setMessages(prev => [...prev, {
              id: newMessage.id,
              senderId: newMessage.senderId,
              content: newMessage.content,
              createdAt: msgDate,
              sender: {
                id: newMessage.senderId,
                name: 'User',
                avatar: null
              }
            }]);
            setTimeout(() => scrollToBottom(), 50);
          } else {
            // Unread count increment for background conversations
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.groupId]: (prev[newMessage.groupId] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localThreads, threads, activeThreadId, currentUserId]);

  // Reset unread count when a thread becomes active
  useEffect(() => {
    if (activeThreadId) {
      setUnreadCounts(prev => ({
        ...prev,
        [activeThreadId]: 0
      }));
    }
  }, [activeThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeThreadId) return;

    const trimmedContent = input.trim();
    if (trimmedContent.length > 2000) return;

    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      content: trimmedContent,
      createdAt: new Date(),
      sender: { id: currentUserId, name: 'You', avatar: null }
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    setTimeout(() => scrollToBottom(), 10);

    try {
      const result = await sendMessageAction({
        groupId: activeThreadId,
        content: trimmedContent
      });

      if (!result.success) {
        setOptimisticMessages(prev => 
          prev.filter(m => m.id !== optimisticMsg.id)
        );
        alert(result.error || 'Failed to send message');
      } else {
        setOptimisticMessages(prev =>
          prev.filter(m => m.id !== optimisticMsg.id)
        );
        if (result.message) {
          setMessages(prev => [
            ...prev,
            {
              ...result.message,
              createdAt: new Date(result.message.createdAt),
            }
          ]);
          // Local update threads info for our own message immediately
          setLocalThreads(prev => {
            const updated = prev.map(t => {
              if (t.id === activeThreadId) {
                return {
                  ...t,
                  lastMessage: trimmedContent,
                  lastMessageAt: new Date()
                };
              }
              return t;
            });
            return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
          });
          setTimeout(() => scrollToBottom(), 50);
        }
      }
    } catch (error) {
      console.error('[handleSendMessage] Error:', error);
      setOptimisticMessages(prev => 
        prev.filter(m => m.id !== optimisticMsg.id)
      );
      alert('Failed to send message');
    }
  };

  // Task 6: Create or transition to a DM thread with selected neighbor
  const handleCreateDM = (targetUserId: string, targetName: string) => {
    setShowNewChatDialog(false);
    setSearchQuery('');
    
    startTransition(async () => {
      try {
        const result = await getOrCreateDMThreadAction(targetUserId);
        if (result.success && result.threadId) {
          const threadId = result.threadId;
          const exists = localThreads.some(t => t.id === threadId);
          
          if (!exists) {
            // Optimistically insert local thread structure
            const newTempThread: Thread = {
              id: threadId,
              name: targetName,
              isPrivate: true,
              members: [
                { userId: currentUserId, name: 'You', avatar: null },
                { userId: targetUserId, name: targetName, avatar: null }
              ],
              lastMessage: null,
              lastMessageAt: new Date()
            };
            setLocalThreads(prev => [newTempThread, ...prev]);
          }
          setActiveThreadId(threadId);
        } else {
          alert(result.error || 'Failed to start DM thread');
        }
      } catch (err) {
        console.error('[handleCreateDM] Error:', err);
        alert('Failed to start DM thread');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-8rem)] gap-4 select-none">
      {/* Sidebar with conversation list & search DMs */}
      <div className="md:col-span-1 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-full bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/20">
          <h2 className="font-black text-sm tracking-tight dark:text-zinc-200">Conversations</h2>
          <button
            onClick={() => setShowNewChatDialog(!showNewChatDialog)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New DM</span>
          </button>
        </div>

        {/* Start new DM overlay */}
        {showNewChatDialog && (
          <div className="p-4 border-b border-slate-200 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/40 space-y-3">
            <input
              type="text"
              placeholder="Search neighbors in your society..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {neighbors
                .filter(n => (n.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleCreateDM(n.id, n.name || 'Neighbor')}
                    disabled={isPending}
                    className="w-full p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={n.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${n.name || 'user'}`}
                        alt={n.name || 'User'}
                        className="w-5 h-5"
                      />
                    </div>
                    <span>{n.name}</span>
                  </button>
                ))}
              {neighbors.filter(n => (n.name || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center py-2 font-medium">No neighbors found in your society.</p>
              )}
            </div>
          </div>
        )}

        {/* Thread listings */}
        <div className="flex-1 overflow-y-auto">
          {localThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-zinc-500 space-y-2">
              <p className="text-sm font-semibold">No chats yet</p>
              <p className="text-xs">Start a direct message with a neighbor using the "New DM" button above.</p>
            </div>
          ) : (
            localThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full p-4 border-b border-slate-100 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-900/30 text-left transition-all duration-200 cursor-pointer ${
                  activeThreadId === thread.id 
                    ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500 dark:bg-emerald-950/10' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-zinc-200 truncate">
                      {thread.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-1">
                      {thread.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  {/* Unread badge */}
                  {unreadCounts[thread.id] > 0 && activeThreadId !== thread.id && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shrink-0">
                      {unreadCounts[thread.id]}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message viewport */}
      <div className="md:col-span-2 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-full bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
        {activeThreadId ? (
          <>
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[...messages, ...optimisticMessages].map((msg) => {
                const isCurrentUser = msg.senderId === currentUserId;
                const isOptimistic = msg.id.startsWith('optimistic-');
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                        isCurrentUser
                          ? 'bg-emerald-600 text-white dark:bg-emerald-700'
                          : 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200/20'
                      } ${isOptimistic ? 'opacity-55' : ''}`}
                    >
                      {!isCurrentUser && (
                        <p className="text-[9px] font-black mb-1 opacity-75">
                          {msg.sender.name || 'User'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  maxLength={2000}
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || input.length > 2000}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition cursor-pointer text-xs"
                >
                  Send
                </button>
              </div>
              {input.length > 1900 && (
                <p className={`text-[10px] mt-1 font-semibold ${input.length > 2000 ? 'text-red-500' : 'text-slate-500'}`}>
                  {input.length}/2000 characters
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 space-y-2">
            <Plus className="w-12 h-12 text-slate-300 dark:text-zinc-700 animate-pulse" />
            <p className="text-sm font-semibold">Select a thread</p>
            <p className="text-xs">Choose a society channel or neighbor to begin chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
