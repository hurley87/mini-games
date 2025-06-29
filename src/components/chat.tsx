'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssistantStream } from 'openai/lib/AssistantStream';
import Markdown from 'react-markdown';
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from 'openai/resources/beta/assistants/assistants';
import { RequiredActionFunctionToolCall } from 'openai/resources/beta/threads/runs/runs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Palette, Zap, Target, Music, Gamepad2 } from 'lucide-react';

type MessageApiResponse = {
  role: 'user' | 'assistant';
  content: { text: { value: string } }[];
};

type MessageProps = {
  role: 'user' | 'assistant';
  text: string;
};

type MessageState = {
  messages: MessageProps[];
  isLoading: boolean;
  error: string | null;
};

const UserMessage = ({ text }: { text: string }) => {
  return (
    <div className="m-2 p-3 bg-[#21262d] text-[#c9d1d9] rounded-lg max-w-[80%] self-end break-words">
      {text}
    </div>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="m-2 p-3 bg-[#2a2a2a] text-[#c9d1d9] rounded-lg max-w-[80%] self-start overflow-x-auto">
      <Markdown>{text}</Markdown>
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case 'user':
      return <UserMessage text={text} />;
    case 'assistant':
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

type ChatProps = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
  buildId: string;
  threadId: string;
  onBuildUpdated?: () => void;
};

// Quick suggestions data
const quickSuggestions = [
  {
    text: 'Change colors',
    icon: Palette,
    description: 'Update the color scheme',
  },
  {
    text: 'Add more power-ups',
    icon: Zap,
    description: 'Include exciting power-ups',
  },
  {
    text: 'Make it harder',
    icon: Target,
    description: 'Increase the difficulty',
  },
  {
    text: 'Add animations',
    icon: Sparkles,
    description: 'Make it more dynamic',
  },
  {
    text: 'Change controls',
    icon: Gamepad2,
    description: 'Modify game controls',
  },
];

const Chat = ({
  functionCallHandler = () => Promise.resolve(''),
  buildId,
  threadId,
  onBuildUpdated,
}: ChatProps) => {
  const [userInput, setUserInput] = useState('');
  const [messageState, setMessageState] = useState<MessageState>({
    messages: [],
    isLoading: true,
    error: null,
  });
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Fetch existing messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      if (!threadId) {
        setMessageState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setMessageState((prev) => ({ ...prev, isLoading: true, error: null }));
        const response = await fetch(`/api/threads/${threadId}/messages`);

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const data = await response.json();
        const formattedMessages = data.messages.map(
          (msg: MessageApiResponse) => ({
            role: msg.role,
            text: msg.content[0]?.text.value ?? '',
          })
        );

        setMessageState({
          messages: formattedMessages,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessageState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Failed to fetch messages',
        }));
      }
    };

    fetchMessages();
  }, [threadId]);

  // automatically scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messageState.messages]);

  const sendMessage = async (text: string) => {
    if (!threadId) {
      console.error('Thread ID missing, cannot send message');
      return;
    }

    const response = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text,
        buildId,
      }),
    });
    if (!response.body) throw new Error('Response body is null');

    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const submitActionResult = async (
    runId: string,
    toolCallOutputs: {
      output: string;
      tool_call_id: string;
      tool_call_name: string;
      args: string;
    }[]
  ) => {
    if (toolCallOutputs.length === 0) return;
    const args = JSON.parse(toolCallOutputs[0].args);
    const title = args.title;
    const html = args.html;
    // Show creating game message immediately
    appendMessage('assistant', 'Updating your game...');

    // Get the access token

    // Handle game creation asynchronously
    const response = await fetch(`/api/update-build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        html,
        title,
      }),
    });

    if (!response.ok) {
      console.error('Error creating game:', response.statusText);
      appendMessage(
        'assistant',
        'Sorry, there was an error creating your game. Please try again.'
      );
      setInputDisabled(false);
      return;
    }

    const data = await response.json();
    if (data.success) {
      appendMessage(
        'assistant',
        'Game updated successfully! A new version has been saved.'
      );
      if (onBuildUpdated) {
        onBuildUpdated();
      }
      // Enable input after successful update
      setInputDisabled(false);
      // Cancel the current run
      try {
        await fetch(`/api/threads/${threadId}/runs/${runId}/cancel`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error cancelling run:', error);
      }
    } else {
      appendMessage(
        'assistant',
        'Sorry, there was an error creating your game. Please try again.'
      );
      // Also enable input when there's an error
      setInputDisabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    // toast: "Updating your game..."
    toast.info('This might take a couple of minutes ...');
    sendMessage(userInput);
    setMessageState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', text: userInput }],
    }));
    setUserInput('');
    setInputDisabled(true);
    setShowSuggestions(false);
    scrollToBottom();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    setShowSuggestions(false);
    setIsInputFocused(true);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (!userInput.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      if (!isInputFocused) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    // Hide suggestions when user starts typing
    if (value.trim()) {
      setShowSuggestions(false);
    } else if (isInputFocused) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

  /* Stream Event Handlers */

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    appendMessage('assistant', '');
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta: { value?: string }) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
  };

  // imageFileDone - show image in chat
  const handleImageFileDone = (image: { file_id: string }) => {
    appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  };

  // toolCallCreated - log new tool call
  const toolCallCreated = (toolCall: { type: string }) => {
    if (toolCall.type != 'code_interpreter') return;
    appendMessage('assistant', '');
  };

  // toolCallDelta - log delta and snapshot for the tool call
  const toolCallDelta = (delta: {
    type: string;
    code_interpreter?: { input?: string };
  }) => {
    if (delta.type != 'code_interpreter') return;
    if (!delta.code_interpreter?.input) return;
    appendToLastMessage(delta.code_interpreter.input);
  };

  // handleRequiresAction - handle function call
  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall: RequiredActionFunctionToolCall) => {
        const result = await functionCallHandler(toolCall);
        return {
          output: result,
          tool_call_id: toolCall.id,
          tool_call_name: toolCall.function.name,
          args: toolCall.function.arguments,
        };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  // handleRunCompleted - re-enable the input form
  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on('textCreated', handleTextCreated);
    stream.on('textDelta', handleTextDelta);

    // image
    stream.on('imageFileDone', handleImageFileDone);

    // code interpreter
    stream.on('toolCallCreated', toolCallCreated);
    stream.on('toolCallDelta', toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on('event', (event) => {
      if (event.event === 'thread.run.requires_action')
        handleRequiresAction(event);
      if (event.event === 'thread.run.completed') handleRunCompleted();
    });
  };

  /*
    =======================
    === Utility Helpers ===
    =======================
  */

  const appendToLastMessage = (text: string) => {
    setMessageState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages.slice(0, -1),
        {
          ...prev.messages[prev.messages.length - 1],
          text: prev.messages[prev.messages.length - 1].text + text,
        },
      ],
    }));
  };

  const appendMessage = (role: 'user' | 'assistant', text: string) => {
    setMessageState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role, text }],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col-reverse">
        <div className="flex flex-col">
          {messageState.isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]" />
            </div>
          ) : messageState.error ? (
            <div className="text-red-500 p-4 text-center">
              {messageState.error}
            </div>
          ) : (
            messageState.messages.map((msg, index) => (
              <Message key={index} role={msg.role} text={msg.text} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="relative">
        {/* Quick Suggestions */}
        {showSuggestions && !inputDisabled && (
          <div className="absolute bottom-full left-0 right-0 p-2.5 bg-[#1a1a1a] border-t border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">
                Quick Suggestions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                return (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-600/20 hover:text-blue-300 transition-colors duration-200 bg-gray-700/50 text-gray-300 border-gray-600 text-sm py-1.5 px-3 flex items-center gap-2"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    title={suggestion.description}
                  >
                    <IconComponent className="h-3 w-3" />
                    {suggestion.text}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full p-2.5 bg-[#1a1a1a] border-t border-gray-800"
        >
          <Textarea
            value={userInput}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to update?"
            className="flex-grow min-h-[48px] max-h-32 px-4 py-2 mr-2.5 rounded-md border-none bg-transparent text-[#c9d1d9] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-gray-400 disabled:opacity-60"
            disabled={inputDisabled}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              className="px-6 bg-gray-500 hover:bg-gray-300 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={inputDisabled}
            >
              {inputDisabled ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
                  Updating ...
                </span>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
