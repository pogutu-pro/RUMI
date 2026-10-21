'use client';

import * as React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, MessageSquarePlus, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth';
import { getUserInitials } from '@/lib/utils/user';
import { cn } from '@/lib/utils/cn';
import {
  useContacts,
  useConversations,
  useMarkConversationRead,
  useOpenConversation,
  useSendMessage,
  useThread,
} from '../hooks/use-messaging';
import type { ChatMessage, ChatPerson, Conversation } from '../types';

const MAX_LENGTH = 2000;

function Person({ person, size = 'h-10 w-10' }: { person: ChatPerson; size?: string }) {
  return (
    <Avatar className={cn('shrink-0', size)}>
      {person.profile_picture && <AvatarImage src={person.profile_picture} alt={person.name} />}
      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
        {getUserInitials(person.name) || '?'}
      </AvatarFallback>
    </Avatar>
  );
}

function listTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return isToday(d) ? format(d, 'HH:mm') : isYesterday(d) ? 'Yesterday' : format(d, 'd MMM');
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  return isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, d MMMM yyyy');
}

/* ------------------------------ conversation list ----------------------------- */

function ConversationList({
  conversations,
  selectedId,
  isLoading,
  onSelect,
  onNew,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (c: Conversation) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <Button size="sm" variant="outline" onClick={onNew} leftIcon={<MessageSquarePlus className="h-4 w-4" />}>
          New
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground">Start one to send your first message.</p>
            <Button size="sm" onClick={onNew}>New message</Button>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                    selectedId === c.id && 'bg-primary/5',
                  )}
                >
                  <Person person={c.other} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate text-sm', c.unread_count ? 'font-semibold' : 'font-medium')}>
                        {c.other.name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{listTime(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-xs',
                          c.unread_count ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {c.last_message_preview || c.other.role_label}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- thread ---------------------------------- */

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%]',
          mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={cn('mt-1 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {format(new Date(message.created_at), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}

function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = React.useState('');
  const send = useSendMessage(conversationId);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const body = text.trim();
    if (!body || send.isPending) return;
    try {
      await send.mutateAsync(body);
      setText('');
      ref.current?.focus();
    } catch {
      // the hook shows the error; keep the text so nothing is lost
    }
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={ref}
          value={text}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Write a message…"
          aria-label="Message"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          className="max-h-32 min-h-11 resize-none rounded-xl"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          onClick={() => void submit()}
          disabled={!text.trim() || send.isPending}
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 px-1 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}

function ThreadPane({
  conversationId,
  fallbackOther,
  onBack,
}: {
  conversationId: string;
  fallbackOther: ChatPerson;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { data, isLoading } = useThread(conversationId);
  const markRead = useMarkConversationRead();
  const endRef = React.useRef<HTMLDivElement>(null);
  const lastReadMarker = React.useRef<string | null>(null);

  const other = data?.other ?? fallbackOther;
  const messages = data?.results ?? [];
  const latest = messages[messages.length - 1];
  const myId = String(user?.id ?? '');

  // Keep the newest message in view.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [conversationId, latest?.id]);

  // Opening a thread (or a reply arriving while it is open) marks it read.
  React.useEffect(() => {
    if (!latest || String(latest.sender) === myId) return;
    if (lastReadMarker.current === latest.id) return;
    lastReadMarker.current = latest.id;
    markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, latest?.id, myId]);

  let lastDay = '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Person person={other} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{other.name}</p>
          <p className="text-xs text-muted-foreground">{other.role_label}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/30 px-4 py-4">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {other.name.split(' ')[0]}.
          </p>
        ) : (
          messages.map((m) => {
            const day = dayLabel(m.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                      {day}
                    </span>
                  </div>
                )}
                <Bubble message={m} mine={String(m.sender) === myId} />
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <Composer conversationId={conversationId} />
    </div>
  );
}

/* ------------------------------ new conversation ------------------------------ */

function NewMessageDialog({
  open,
  onOpenChange,
  onPick,
  isOpening,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (person: ChatPerson) => void;
  isOpening: boolean;
}) {
  const { data: contacts = [], isLoading } = useContacts();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>Choose who you want to write to.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            There is nobody you can message yet. People appear here once you are linked through a property.
          </p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {contacts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={isOpening}
                  onClick={() => onPick(p)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <Person person={p} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.role_label}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------- page ----------------------------------- */

interface Selected {
  id: string;
  other: ChatPerson;
}

/**
 * Direct messaging between the people in a rental: tenants and caretakers,
 * caretakers and landlords, landlords and the RumiaRent team. Separate from
 * support tickets, which are for problems with the system itself.
 */
export function MessagesView() {
  const { data: conversations = [], isLoading } = useConversations();
  const open = useOpenConversation();
  const [selected, setSelected] = React.useState<Selected | null>(null);
  const [picking, setPicking] = React.useState(false);

  const handlePick = async (person: ChatPerson) => {
    const conversation = await open.mutateAsync(person.id);
    setSelected({ id: conversation.id, other: conversation.other });
    setPicking(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with the people you work with. For a problem with RumiaRent itself, use Support.
        </p>
      </div>

      <div className="grid h-[calc(100dvh-19rem)] min-h-[380px] md:h-[calc(100dvh-13rem)] md:min-h-[420px] overflow-hidden rounded-2xl border bg-background shadow-sm md:grid-cols-[320px_1fr]">
        <div className={cn('min-h-0', selected ? 'hidden md:block' : 'block')}>
          <ConversationList
            conversations={conversations}
            selectedId={selected?.id ?? null}
            isLoading={isLoading}
            onSelect={(c) => setSelected({ id: c.id, other: c.other })}
            onNew={() => setPicking(true)}
          />
        </div>

        <div className={cn('min-h-0', selected ? 'block' : 'hidden md:block')}>
          {selected ? (
            <ThreadPane
              key={selected.id}
              conversationId={selected.id}
              fallbackOther={selected.other}
              onBack={() => setSelected(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Select a conversation</p>
              <p className="text-xs text-muted-foreground">Or start a new one with the New button.</p>
            </div>
          )}
        </div>
      </div>

      <NewMessageDialog open={picking} onOpenChange={setPicking} onPick={handlePick} isOpening={open.isPending} />
    </div>
  );
}
