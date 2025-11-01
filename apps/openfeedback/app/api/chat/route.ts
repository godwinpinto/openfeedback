import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system?: string } = await req.json();
 console.log("server received messages", messages);
  const result = streamText({
    model: google('gemini-2.0-flash-exp'),
    system: system || 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

