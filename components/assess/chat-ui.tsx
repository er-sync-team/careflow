import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.from === 'user') {
    return (
      <div className="flex animate-fade-up justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-sm text-white shadow-sm">{message.text}</p>
      </div>
    );
  }
  return (
    <div className="flex animate-fade-up items-end gap-2">
      <BotAvatar />
      <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-es-md border border-border bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm">
        {message.text}
      </p>
    </div>
  );
}

function BotAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
      <HeartPulse className="h-4 w-4" />
    </span>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <BotAvatar />
      <div className="flex gap-1 rounded-2xl rounded-es-md border border-border bg-white px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export function Chip({ selected, onClick, children, danger }: { selected: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
        selected
          ? danger
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-primary bg-primary text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

export function OptionButton({ onClick, title, hint }: { onClick: () => void; title: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-start transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <span className="block text-sm font-semibold text-slate-900 group-hover:text-primary">{title}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </button>
  );
}
