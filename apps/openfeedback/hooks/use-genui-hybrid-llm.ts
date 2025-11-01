'use client';

import { useChat, type UseChatHelpers, type UseChatOptions } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LocalChatTransport, type LocalChatTransportOptions } from '@/lib/genui-local-chat-transport';

export type TransportMode = 'local' | 'remote';

export interface UseGenUIHybridLLMOptions extends Omit<UseChatOptions<UIMessage>, 'transport' | 'id'> {
  /**
   * Initial transport mode. Defaults to 'remote' if local is not available.
   */
  initialMode?: TransportMode;
  /**
   * Options for local transport when using Chrome LanguageModel API
   */
  localTransportOptions?: LocalChatTransportOptions;
  /**
   * API endpoint for remote transport. Defaults to '/api/chat'
   */
  remoteApiEndpoint?: string;
  /**
   * Whether to automatically use local transport if available
   */
  autoUseLocalIfAvailable?: boolean;
  /**
   * Chat ID prefix. The actual ID will be prefixed with the transport mode.
   */
  chatIdPrefix?: string;
}

export interface UseGenUIHybridLLMReturn extends UseChatHelpers<UIMessage> {
  /**
   * Current transport mode ('local' or 'remote')
   */
  transportMode: TransportMode;
  /**
   * Whether local LLM is supported in this browser
   */
  isLocalSupported: boolean;
  /**
   * Whether local LLM is available (may need download)
   */
  localAvailability: 'available' | 'downloadable' | 'unavailable' | 'checking';
  /**
   * Switch to a different transport mode
   */
  setTransportMode: (mode: TransportMode) => void;
  /**
   * Current transport instance
   */
  transport: LocalChatTransport | DefaultChatTransport<UIMessage>;
}

export function useGenUIHybridLLM(
  options: UseGenUIHybridLLMOptions = {}
): UseGenUIHybridLLMReturn {
  const {
    initialMode,
    localTransportOptions = {},
    remoteApiEndpoint = '/api/chat',
    autoUseLocalIfAvailable = false,
    chatIdPrefix = 'chat',
    ...useChatOptions
  } = options;

  // State for transport mode
  const [transportMode, setTransportModeState] = useState<TransportMode>(() => {
    // We'll check support and set mode after mount to avoid hydration mismatch
    return initialMode || 'remote';
  });

  // State for local LLM support and availability
  const [isLocalSupported, setIsLocalSupported] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<'available' | 'downloadable' | 'unavailable' | 'checking'>('checking');

  // Preserve messages across transport switches
  const preservedMessagesRef = useRef<UIMessage[]>([]);
  const prevTransportModeRef = useRef<TransportMode>(transportMode);

  // Check local LLM support and availability after mount (client-only)
  useEffect(() => {
    const checkLocalSupport = async () => {
      const supported = LocalChatTransport.isSupported();
      setIsLocalSupported(supported);

      if (supported) {
        setLocalAvailability('checking');
        try {
          const availability = await LocalChatTransport.checkAvailability({
            expectedInputs: localTransportOptions.expectedInputs,
            expectedOutputs: localTransportOptions.expectedOutputs,
          });
          setLocalAvailability(availability);
          
          // Auto-enable local if available and autoUseLocalIfAvailable is true
          if (autoUseLocalIfAvailable && availability !== 'unavailable' && initialMode !== 'remote') {
            setTransportModeState('local');
          }
        } catch {
          setLocalAvailability('unavailable');
        }
      } else {
        setLocalAvailability('unavailable');
      }
    };

    checkLocalSupport();
  }, [autoUseLocalIfAvailable, initialMode, localTransportOptions.expectedInputs, localTransportOptions.expectedOutputs]);

  // Determine which transport to use
  const shouldUseLocal = useMemo(() => {
    return transportMode === 'local' && isLocalSupported && localAvailability !== 'unavailable';
  }, [transportMode, isLocalSupported, localAvailability]);

  // Create transport based on mode
  const transport = useMemo(() => {
    if (shouldUseLocal) {
      return new LocalChatTransport({
        system: 'You are a helpful assistant.',
        temperature: 1.0,
        ...localTransportOptions,
      });
    } else {
      return new DefaultChatTransport({
        api: remoteApiEndpoint,
      });
    }
  }, [shouldUseLocal, localTransportOptions, remoteApiEndpoint]);

  // Generate unique chat ID based on transport mode
  const chatId = useMemo(() => {
    return `${chatIdPrefix}-${transportMode}`;
  }, [chatIdPrefix, transportMode]);

  // Use the useChat hook with the appropriate transport
  const chatHelpers = useChat({
    ...useChatOptions,
    transport,
    id: chatId,
  });

  // Preserve messages before switching transports
  useEffect(() => {
    if (chatHelpers.messages.length > 0) {
      preservedMessagesRef.current = chatHelpers.messages;
    }
  }, [chatHelpers.messages]);

  // Restore messages when switching transports
  useEffect(() => {
    // Only restore if we just switched transports and messages were cleared
    if (
      prevTransportModeRef.current !== transportMode &&
      preservedMessagesRef.current.length > 0 &&
      chatHelpers.messages.length === 0 &&
      chatHelpers.status === 'ready'
    ) {
      chatHelpers.setMessages(preservedMessagesRef.current);
    }
    prevTransportModeRef.current = transportMode;
  }, [transportMode, chatHelpers.messages.length, chatHelpers.status, chatHelpers.setMessages]);

  // Function to switch transport mode
  const setTransportMode = (mode: TransportMode) => {
    // Only allow switching if not currently streaming
    if (chatHelpers.status !== 'submitted' && chatHelpers.status !== 'streaming') {
      // Preserve current messages before switching
      if (chatHelpers.messages.length > 0) {
        preservedMessagesRef.current = chatHelpers.messages;
      }
      setTransportModeState(mode);
    }
  };

  return {
    ...chatHelpers,
    transportMode,
    isLocalSupported,
    localAvailability,
    setTransportMode,
    transport,
  };
}

