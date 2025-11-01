'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGenUIHybridLLM } from '@/hooks/use-genui-hybrid-llm';

export default function TestPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the hybrid LLM hook that manages transport switching and preserves message history
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    transportMode,
    isLocalSupported,
    localAvailability,
    setTransportMode,
    transport,
  } = useGenUIHybridLLM({
    autoUseLocalIfAvailable: true, // Automatically use local if available
    chatIdPrefix: 'test-chat',
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 pt-20">
      <Card className="flex h-full w-full max-w-4xl flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Chat</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="transport-toggle"
                  className={`text-sm ${transportMode === 'remote' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                >
                  Remote API
                </Label>
                <Switch
                  id="transport-toggle"
                  checked={transportMode === 'local' && isLocalSupported}
                  onCheckedChange={(checked) => {
                    setTransportMode(checked && isLocalSupported ? 'local' : 'remote');
                  }}
                  disabled={
                    status === 'submitted' ||
                    status === 'streaming' ||
                    !isLocalSupported ||
                    localAvailability === 'unavailable'
                  }
                  title={
                    !isLocalSupported
                      ? 'Local AI is not supported in this browser'
                      : localAvailability === 'unavailable'
                      ? 'Local AI is unavailable'
                      : transportMode === 'local'
                      ? 'Using Local Chrome AI'
                      : 'Using Remote API'
                  }
                />
                <Label
                  htmlFor="transport-toggle"
                  className={`text-sm ${transportMode === 'local' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                >
                  Local Chrome AI
                  {localAvailability === 'checking' && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Checking...
                    </Badge>
                  )}
                  {localAvailability === 'downloadable' && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Downloadable
                    </Badge>
                  )}
                  {localAvailability === 'available' && transportMode === 'local' && (
                    <Badge variant="default" className="ml-1 text-xs">
                      Available
                    </Badge>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 rounded-md border p-4">
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  Start a conversation by typing a message below.
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.parts.map((part, index) => {
                        if (part.type === 'text') {
                          return <span key={index}>{part.text}</span>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {(status === 'submitted' || status === 'streaming') && (
                <div className="flex justify-start gap-2">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <div>An error occurred. Please try again.</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={status !== 'ready'}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex gap-2">
              {(status === 'submitted' || status === 'streaming') && (
                <Button type="button" variant="outline" onClick={stop}>
                  Stop
                </Button>
              )}
              <Button type="submit" disabled={status !== 'ready' || !input.trim()}>
                {status === 'ready' ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
