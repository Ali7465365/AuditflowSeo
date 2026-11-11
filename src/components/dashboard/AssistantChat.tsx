import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useProfile } from '@/context/AuthContext';
import { generateAssistantResponse } from '@/lib/assistant';
import { useModalDismiss } from '@/lib/useModalDismiss';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const GREETING: ChatMessage = {
  id: 0,
  role: 'assistant',
  text:
    "Hi, I'm AuditFlow AI. Ask me how to run an audit, what a report check means, how to improve a URL, or which plan fits your work. I only help with AuditFlow SEO and website audits.",
};

const SUGGESTIONS = [
  'How do I run an audit?',
  'What does the Overall Score mean?',
  'How do I improve my score?',
  'Which plan should I choose?',
];

export function AssistantChat() {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useModalDismiss(() => setOpen(false), open, { lockScroll: false });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setThinking(true);

    window.setTimeout(() => {
      const result = generateAssistantResponse(trimmed, profile.plan);
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setThinking(false);
    }, 650);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AuditFlow AI assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 sm:bottom-6 sm:right-6"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500/40" aria-hidden="true" />
        <MessageSquare className="relative h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 sm:bottom-6 sm:right-6">
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              AuditFlow AI
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            </p>
            <p className="text-xs text-slate-400">SEO &amp; audit assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300">
              <Bot className="h-4 w-4" />
            </span>
            <span className="flex gap-1">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
          </div>
        )}
        {messages.length <= 1 && !thinking && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-indigo-500/40 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about audits, reports, or plans..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
          isUser ? 'bg-slate-700 text-slate-200' : 'bg-indigo-600 text-white'
        }`}
      >
        {isUser ? 'You' : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={`max-w-[78%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-[1.5] ${
          isUser ? 'bg-indigo-600 text-white' : 'border border-white/10 bg-white/5 text-slate-200'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"
      style={{ animationDelay: delay }}
    />
  );
}
