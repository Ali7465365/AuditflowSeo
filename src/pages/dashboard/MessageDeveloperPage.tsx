import { ArrowLeft, Inbox, Lock, Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useProfile } from '@/context/AuthContext';
import { DEFAULT_AVATAR_STYLE } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { avatarClasses, avatarInitial } from '@/lib/avatar';

const DEVELOPER_EMAIL = 'maoun2012@gmail.com';

interface DevMessage {
  id: string;
  sender_email: string;
  recipient_email: string;
  body: string;
  created_at: string;
}

interface ThreadSummary {
  email: string;
  lastMessage: string;
  lastAt: string;
  unread: boolean;
}

const MESSAGE_COLUMNS = 'id, sender_email, recipient_email, body, created_at';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function partnerEmail(message: DevMessage, selfEmail: string) {
  return message.sender_email === selfEmail ? message.recipient_email : message.sender_email;
}

function buildThreads(messages: DevMessage[], selfEmail: string): ThreadSummary[] {
  const map = new Map<string, ThreadSummary>();
  for (const message of messages) {
    const partner = partnerEmail(message, selfEmail);
    const existing = map.get(partner);
    const isNewer = !existing || message.created_at > existing.lastAt;
    const incoming = message.recipient_email === selfEmail;
    if (isNewer) {
      map.set(partner, {
        email: partner,
        lastMessage: message.body,
        lastAt: message.created_at,
        unread: incoming && isNewer && (!existing || existing.unread),
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

export function MessageDeveloperPage() {
  const profile = useProfile();
  const isDeveloper = profile.email === DEVELOPER_EMAIL;
  return isDeveloper ? <DeveloperInbox /> : <UserThread />;
}

function UserThread() {
  const profile = useProfile();
  const [messages, setMessages] = useState<DevMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('dev_messages')
        .select(MESSAGE_COLUMNS)
        .or(`sender_email.eq.${profile.email},recipient_email.eq.${profile.email}`)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (loadError) {
        setError('Could not load your conversation. Please refresh.');
        setLoading(false);
        return;
      }
      setMessages((data as DevMessage[]) ?? []);
      setError(null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [profile.email]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const { data } = await supabase
        .from('dev_messages')
        .select(MESSAGE_COLUMNS)
        .or(`sender_email.eq.${profile.email},recipient_email.eq.${profile.email}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as DevMessage[]);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [profile.email]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const { data, error: sendError } = await supabase
      .from('dev_messages')
      .insert({ sender_email: profile.email, recipient_email: DEVELOPER_EMAIL, body })
      .select(MESSAGE_COLUMNS)
      .single();
    setSending(false);
    setInput('');
    if (sendError || !data) {
      setError('Your message could not be sent. Please try again.');
      setInput(body);
      return;
    }
    setMessages((prev) => [...prev, data as DevMessage]);
    inputRef.current?.focus();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
          <Lock className="h-4 w-4" aria-hidden="true" /> Private
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Message Developer</h1>
        <p className="mt-2 text-slate-400">A private 1-on-1 conversation with the developer. Only you and the developer can see these messages.</p>
      </div>

      <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <span className={avatarClasses({ ...DEFAULT_AVATAR_STYLE, bg: 'slate', ring: 'indigo' }, 'h-10 w-10 text-sm')}>D</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Developer</p>
            <p className="truncate text-xs text-slate-400">Private conversation</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Private
          </span>
        </div>

        <ThreadMessages messages={messages} selfEmail={profile.email} loading={loading} scrollRef={scrollRef} />

        <SendForm
          input={input}
          setInput={setInput}
          sending={sending}
          error={error}
          inputRef={inputRef}
          onSubmit={handleSend}
          placeholder="Type a private message to the developer..."
        />
      </div>
    </div>
  );
}

function DeveloperInbox() {
  const profile = useProfile();
  const [allMessages, setAllMessages] = useState<DevMessage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('dev_messages')
        .select(MESSAGE_COLUMNS)
        .or(`sender_email.eq.${profile.email},recipient_email.eq.${profile.email}`)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (loadError) {
        setError('Could not load your inbox. Please refresh.');
        setLoading(false);
        return;
      }
      setAllMessages((data as DevMessage[]) ?? []);
      setError(null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [profile.email]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const { data } = await supabase
        .from('dev_messages')
        .select(MESSAGE_COLUMNS)
        .or(`sender_email.eq.${profile.email},recipient_email.eq.${profile.email}`)
        .order('created_at', { ascending: true });
      if (data) setAllMessages(data as DevMessage[]);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [profile.email]);

  const threads = buildThreads(allMessages, profile.email);
  const threadMessages = selected
    ? allMessages.filter(
        (m) =>
          (m.sender_email === profile.email && m.recipient_email === selected) ||
          (m.sender_email === selected && m.recipient_email === profile.email),
      )
    : [];

  if (loading) {
    return <div className="mx-auto max-w-3xl py-20 text-center text-slate-400">Loading your inbox...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
          <Inbox className="h-4 w-4" aria-hidden="true" /> Developer inbox
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Private conversations</h1>
        <p className="mt-2 text-slate-400">Each thread is a private 1-on-1 conversation with a user. Select one to reply.</p>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-white">No messages yet</p>
          <p className="mt-2 text-slate-400">When users message you, their conversations will appear here.</p>
        </div>
      ) : selected ? (
        <DeveloperThread
          userEmail={selected}
          messages={threadMessages}
          onBack={() => setSelected(null)}
        />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.email}>
              <button
                type="button"
                onClick={() => setSelected(thread.email)}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900"
              >
                <span className={avatarClasses({ ...DEFAULT_AVATAR_STYLE, bg: 'indigo', ring: 'none' }, 'h-11 w-11 text-base')}>
                  {avatarInitial(thread.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{thread.email}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-400">{thread.lastMessage}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{formatTime(thread.lastAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeveloperThread({ userEmail, messages, onBack }: { userEmail: string; messages: DevMessage[]; onBack: () => void }) {
  const profile = useProfile();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<DevMessage[]>(messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [localMessages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const { data, error: sendError } = await supabase
      .from('dev_messages')
      .insert({ sender_email: profile.email, recipient_email: userEmail, body })
      .select(MESSAGE_COLUMNS)
      .single();
    setSending(false);
    setInput('');
    if (sendError || !data) {
      setError('Your reply could not be sent. Please try again.');
      setInput(body);
      return;
    }
    setLocalMessages((prev) => [...prev, data as DevMessage]);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className={avatarClasses({ ...DEFAULT_AVATAR_STYLE, bg: 'indigo', ring: 'none' }, 'h-10 w-10 text-sm')}>
          {avatarInitial(userEmail)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userEmail}</p>
          <p className="truncate text-xs text-slate-400">Private conversation</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Private
        </span>
      </div>

      <ThreadMessages messages={localMessages} selfEmail={profile.email} loading={false} scrollRef={scrollRef} />

      <SendForm
        input={input}
        setInput={setInput}
        sending={sending}
        error={error}
        inputRef={inputRef}
        onSubmit={handleSend}
        placeholder="Type a private reply..."
      />
    </div>
  );
}

function ThreadMessages({
  messages,
  selfEmail,
  loading,
  scrollRef,
}: {
  messages: DevMessage[];
  selfEmail: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div ref={scrollRef} className="h-[55vh] min-h-[320px] space-y-4 overflow-y-auto px-5 py-6">
      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading your conversation...</p>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-300">No messages yet</p>
          <p className="mt-1 text-sm text-slate-500">Send the first message below to start the conversation.</p>
        </div>
      ) : (
        messages.map((message) => {
          const isMe = message.sender_email === selfEmail;
          return (
            <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-[1.5] ${
                  isMe ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md border border-white/10 bg-white/5 text-slate-200'
                }`}
              >
                {message.body}
              </div>
              <span className="mt-1 px-2 text-[11px] text-slate-500">{formatTime(message.created_at)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

function SendForm({
  input,
  setInput,
  sending,
  error,
  inputRef,
  onSubmit,
  placeholder,
}: {
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  error: string | null;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-white/5 p-4">
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
          {error}
        </p>
      )}
      <div className="flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event as unknown as FormEvent<HTMLFormElement>);
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Press Enter to send. Shift + Enter for a new line.</p>
    </form>
  );
}
