'use client';

import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';

// Type definitions for Chrome LanguageModel API
type LanguageModelAvailability = 'available' | 'downloadable' | 'unavailable';

interface LanguageModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

interface LanguageModelCreateOptions {
  topK?: number;
  temperature?: number;
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image' | 'audio'; value: string | File | HTMLCanvasElement }>;
    prefix?: boolean;
  }>;
  expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>;
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>;
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
}

interface LanguageModelSession {
  prompt(messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: 'text' | 'image' | 'audio'; value: string | File | HTMLCanvasElement }>; prefix?: boolean }>, options?: { signal?: AbortSignal; responseConstraint?: any }): Promise<string>;
  promptStreaming(messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: 'text' | 'image' | 'audio'; value: string | File | HTMLCanvasElement }>; prefix?: boolean }>, options?: { signal?: AbortSignal; responseConstraint?: any }): ReadableStream<string>;
  append(messages: Array<{ role: 'user' | 'assistant'; content: string | Array<{ type: 'text' | 'image' | 'audio'; value: string | File | HTMLCanvasElement }>; prefix?: boolean }>): Promise<void>;
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
  destroy(): void;
  inputUsage: number;
  inputQuota: number;
}

interface LanguageModelGlobal {
  availability(options?: { expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>; expectedOutputs?: Array<{ type: 'text'; languages?: string[] }> }): Promise<LanguageModelAvailability>;
  params(): Promise<LanguageModelParams>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}


export interface LocalChatTransportOptions {
  system?: string;
  temperature?: number;
  topK?: number;
  expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>;
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>;
  onProgress?: (percent: number) => void;
}

/**
 * LocalChatTransport uses Chrome's LanguageModel API to run chat locally
 * instead of making HTTP requests to a server.
 */
export class LocalChatTransport implements ChatTransport<UIMessage> {
  private session: LanguageModelSession | null = null;
  private sessionAbortController: AbortController | null = null;
  private options: LocalChatTransportOptions;
  private isInitialized = false;
  private processedMessageCount = 0; // Track how many messages we've processed in the session

  constructor(options: LocalChatTransportOptions = {}) {
    this.options = options;
  }

  /**
   * Check if LanguageModel API is supported in the current environment
   */
  static isSupported(): boolean {
    if (typeof self === 'undefined') return false;
    return 'LanguageModel' in (self as any);
  }

  /**
   * Check LanguageModel availability
   */
  static async checkAvailability(
    options?: { expectedInputs?: Array<{ type: 'text' | 'image' | 'audio'; languages?: string[] }>; expectedOutputs?: Array<{ type: 'text'; languages?: string[] }> }
  ): Promise<LanguageModelAvailability> {
    if (!this.isSupported()) return 'unavailable';
    try {
      const globalSelf = (typeof self !== 'undefined' ? self : window) as any;
      const LanguageModel = globalSelf.LanguageModel as LanguageModelGlobal;
      return await LanguageModel.availability(options);
    } catch {
      return 'unavailable';
    }
  }

  /**
   * Initialize or reuse the LanguageModel session
   */
  private async ensureSession(): Promise<LanguageModelSession> {
    if (this.session && this.isInitialized) {
      return this.session;
    }

    const globalSelf = (typeof self !== 'undefined' ? self : window) as any;
    if (typeof globalSelf.LanguageModel === 'undefined') {
      throw new Error('Chrome LanguageModel API is not available.');
    }

    const LanguageModel = globalSelf.LanguageModel as LanguageModelGlobal;

    // Check availability
    const availability = await LanguageModel.availability({
      expectedInputs: this.options.expectedInputs,
      expectedOutputs: this.options.expectedOutputs,
    });

    if (availability === 'unavailable') {
      throw new Error('LanguageModel is not available on this device.');
    }

    // Get params for defaults
    const params = await LanguageModel.params();

    // Create abort controller for session
    this.sessionAbortController = new AbortController();

    // Prepare initial prompts (system message only at creation time)
    const initialPrompts: Array<{ role: 'system'; content: string }> = [];
    if (this.options.system) {
      initialPrompts.push({
        role: 'system',
        content: this.options.system,
      });
    }

    // Create session with monitor for download progress
    const createOptions: LanguageModelCreateOptions = {
      temperature: this.options.temperature ?? params.defaultTemperature,
      topK: this.options.topK ?? params.defaultTopK,
      expectedInputs: this.options.expectedInputs,
      expectedOutputs: this.options.expectedOutputs,
      signal: this.sessionAbortController.signal,
      initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
      monitor: (m: any) => {
        try {
          m?.addEventListener?.('downloadprogress', (e: any) => {
            if (typeof e.loaded === 'number' && typeof e.total === 'number') {
              const percent = Math.round((e.loaded / e.total) * 100);
              this.options.onProgress?.(percent);
            }
          });
        } catch {}
      },
    };

    this.session = await LanguageModel.create(createOptions);
    this.isInitialized = true;

    return this.session;
  }

  /**
   * Convert UIMessage to LanguageModel message format for appending
   */
  private convertMessageForAppend(message: UIMessage): Array<{
    role: 'user' | 'assistant';
    content: string;
  }> {
    if (!message.parts || !Array.isArray(message.parts)) {
      return [];
    }

    const textParts = message.parts
      .filter((part) => {
        if (!part) {
          return false;
        }
        return part.type === 'text';
      })
      .map((part) => {
        if (!part) {
          return '';
        }
        const text = (part as any)?.text;
        if (text === undefined) {
          return '';
        }
        return text;
      })
      .filter(text => text !== undefined && text !== null)
      .join('');

    if (!textParts.trim()) {
      return [];
    }

    return [
      {
        role: message.role === 'user' ? 'user' : 'assistant',
        content: textParts,
      },
    ];
  }

  /**
   * Convert UIMessage to LanguageModel message format
   */
  private convertMessageToLanguageModelFormat(message: UIMessage): Array<{
    role: 'user' | 'assistant';
    content: string | Array<{ type: 'text'; value: string }>;
  }> {
    if (!message.parts || !Array.isArray(message.parts)) {
      return [];
    }

    const textParts = message.parts
      .filter((part) => {
        if (!part) {
          return false;
        }
        return part.type === 'text';
      })
      .map((part) => {
        if (!part) {
          return '';
        }
        const text = (part as any)?.text;
        if (text === undefined) {
          return '';
        }
        return text;
      })
      .filter(text => text !== undefined && text !== null)
      .join('');

    if (!textParts.trim()) {
      return [];
    }

    return [
      {
        role: message.role === 'user' ? 'user' : 'assistant',
        content: textParts,
      },
    ];
  }

  /**
   * Stream chat response using LanguageModel API
   */
  async *streamChat(messages: UIMessage[], options?: { signal?: AbortSignal }): AsyncGenerator<UIMessageChunk> {
    if (messages.length === 0) {
      throw new Error('No messages provided');
    }

    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage) {
      throw new Error('Last message is undefined');
    }
    
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    try {
      // Ensure session is initialized
      const session = await this.ensureSession();

      // Append any new messages to the session context (excluding the last user message)
      // The session maintains context, so we only need to append messages that haven't been processed yet
      const messagesToAppend = messages.slice(this.processedMessageCount, -1);
      
      for (const message of messagesToAppend) {
        // Skip if this is the assistant response we just generated (it will be in the messages array)
        // The assistant response should not be appended as it's the result of our prompt
        if (message.role === 'assistant') {
          continue;
        }
        
        const languageModelMessages = this.convertMessageForAppend(message);
        if (languageModelMessages.length > 0) {
          await session.append(languageModelMessages);
          this.processedMessageCount++;
        }
      }

      // Convert the last user message for prompting
      const languageModelMessages = this.convertMessageToLanguageModelFormat(lastMessage);

      if (languageModelMessages.length === 0) {
        throw new Error('Message has no text content');
      }

      // Use promptStreaming for streaming responses
      const stream = session.promptStreaming(languageModelMessages, {
        signal: options?.signal,
      });

      let fullText = '';
      let messageId: string | undefined;

      // Generate a message ID
      messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Generate a text part ID (separate from messageId, used for text-start/delta/end chunks)
      // Following the pattern from transformTextToUiMessageStream
      const textPartId = `text-1`;

      // Yield text chunks as they come
      // ReadableStream<string> needs to be consumed with reader
      const reader = stream.getReader();
      
      // Yield text-start to initialize the text part
      // This matches the pattern from transformTextToUiMessageStream
      yield {
        type: 'text-start',
        id: textPartId,
      } as UIMessageChunk;
      
      try {
        while (true) {
          const readResult = await reader.read();
          
          const { done, value } = readResult;
          if (done) {
            // Yield text-end to finalize the text part before finish
            yield {
              type: 'text-end',
              id: textPartId,
            } as UIMessageChunk;
            // Yield finish chunk immediately when stream is done
            yield {
              type: 'finish',
              id: messageId,
            } as UIMessageChunk;
            break;
          }
          
          if (typeof value === 'string') {
            fullText += value;
            
            // Yield text-delta chunk with the text part ID
            yield {
              type: 'text-delta',
              id: textPartId,
              delta: value,
            } as UIMessageChunk;
          }
        }
      } catch (streamError) {
        // If error occurs, try to yield text-end before throwing
        try {
          yield {
            type: 'text-end',
            id: textPartId,
          } as UIMessageChunk;
        } catch {
          // Ignore if we can't yield text-end
        }
        throw streamError;
      } finally {
        reader.releaseLock();
      }

      // Update processed message count after successful response
      // Note: We add 1 to account for the assistant response that will be added
      this.processedMessageCount = messages.length + 1;
    } catch (error) {
      // Yield error chunk
      yield {
        type: 'error',
        errorText: error instanceof Error ? error.message : String(error),
      } as UIMessageChunk;
      throw error;
    }
  }

  /**
   * Send messages and get streaming response
   * This method is called by useChat hook
   */
  async sendMessages(options: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UIMessage[];
    abortSignal: AbortSignal | undefined;
    [key: string]: unknown;
  }): Promise<ReadableStream<UIMessageChunk>> {
    const self = this;
    const { messages, abortSignal } = options;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages must be an array');
    }

    // Create a readable stream
    const stream = new ReadableStream<UIMessageChunk>({
      async start(controller) {
        let streamClosed = false; // Declare before abort handler
        let chunkIndex = 0;
        
        try {
          // Handle abort signal
          if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
              streamClosed = true;
              if (self.sessionAbortController) {
                self.sessionAbortController.abort();
              }
              try {
                controller.close();
              } catch {
                // May already be closed
              }
            });
          }

          // Stream chunks
          let finishChunkReceived = false;
          let finishChunkEnqueued = false;
          
          try {
            for await (const chunk of self.streamChat(messages, { signal: abortSignal })) {
              chunkIndex++;
              
              // Track if this is the finish chunk
              if (chunk.type === 'finish') {
                finishChunkReceived = true;
              }
              
              // If stream was already closed by consumer, skip non-finish chunks
              // But we still want to process the finish chunk even if stream is closed
              if (streamClosed && chunk.type !== 'finish') {
                // Skip non-finish chunks if stream is already closed
                continue;
              }
              
              try {
                // Try to enqueue the chunk (if stream is closed, this will fail for finish chunk too)
                controller.enqueue(chunk);
                
                // Track if finish chunk was successfully enqueued
                if (chunk.type === 'finish') {
                  finishChunkEnqueued = true;
                  // Once we've processed the finish chunk, we can stop
                  break;
                }
              } catch (enqueueError: any) {
                // If stream was closed by consumer, that's okay
                if (enqueueError?.message?.includes('closed') || enqueueError?.message?.includes('Cannot enqueue')) {
                  // Mark stream as closed if not already
                  if (!streamClosed) {
                    streamClosed = true;
                  }
                  
                  // If this was a finish chunk, we've received it even if we can't enqueue it
                  if (chunk.type === 'finish') {
                    finishChunkReceived = true;
                    // We've received the finish chunk, so we can stop now
                    break;
                  } else {
                    // For non-finish chunks, continue waiting for the finish chunk
                    // Don't break - continue the loop
                  }
                } else {
                  throw enqueueError;
                }
              }
            }
          } catch (streamError: any) {
            // If the async generator throws because stream was closed, that's okay
            if (streamError?.message?.includes('closed') || streamError?.message?.includes('aborted')) {
              streamClosed = true;
            } else {
              throw streamError;
            }
          }
          
          // Close the controller if stream wasn't already closed
          if (!streamClosed) {
            try {
              controller.close();
            } catch {
              // May already be closed
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return stream;
  }

  /**
   * Reconnect to an existing stream (not applicable for local transport, but required by interface)
   */
  async reconnectToStream(_options: {
    chatId: string;
    [key: string]: unknown;
  }): Promise<ReadableStream<UIMessageChunk> | null> {
    // Local transport doesn't support reconnection
    // Return null to indicate reconnection is not supported
    return null;
  }

  /**
   * Cleanup: destroy the session
   */
  destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
      } catch {}
      this.session = null;
    }
    if (this.sessionAbortController) {
      this.sessionAbortController.abort();
      this.sessionAbortController = null;
    }
    this.isInitialized = false;
    this.processedMessageCount = 0;
  }
}

