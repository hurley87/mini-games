"use client";

import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

type MessageProps = {
  role: "user" | "assistant";
  text: string;
};

const UserMessage = ({ text }: { text: string }) => {
  return (
    <div className="m-2 p-2 bg-black text-white rounded-[15px] max-w-[80%] self-end break-words">
      {text}
    </div>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="m-2 p-2 bg-[#efefef] rounded-[15px] max-w-[80%] self-start overflow-x-auto">
      <Markdown>{text}</Markdown>
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    default:
      return null;
  }
};

type ChatProps = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
};

const Chat = ({
  functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: ChatProps) => {
  const router = useRouter();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [currentCodeBlock, setCurrentCodeBlock] = useState("");
  const { address } = useAccount();

  console.log('address', address);

  // automatically scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // create a new threadID when chat component created
  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/threads`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const sendMessage = async (text: string) => {
    const response = await fetch(
      `/api/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: text,
        }),
      }
    );
    if (!response.body) throw new Error('Response body is null');
    
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const submitActionResult = async (runId: string, toolCallOutputs: { output: string, tool_call_id: string, tool_call_name: string, args: string }[]) => {
    if(toolCallOutputs.length === 0) return;
    console.log('submitActionResult', runId, toolCallOutputs, toolCallOutputs[0].args);
    const args = JSON.parse(toolCallOutputs[0].args);
    const gameName = args.game_name;
    const category = args.category;
    const buildInstructions = args.build_instructions;
    console.log('gameName', gameName);

    // Show creating game message immediately
    appendMessage("assistant", "Creating your game...");

    // Handle game creation asynchronously
    const response = await fetch(
      `/api/save-game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          address,
          gameName,
          runId,
          category,
          buildInstructions,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error creating game:', response.statusText);
      appendMessage("assistant", "Sorry, there was an error creating your game. Please try again.");
      return;
    }

    const data = await response.json();
    console.log('data', data);
    if (data.success) {
      appendMessage("assistant", "Game created successfully!");
    } else {
      appendMessage("assistant", "Sorry, there was an error creating your game. Please try again.");
    }

    // redirect to game page
    router.push(`/game/${data.game_id}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: userInput },
    ]);
    setUserInput("");
    setInputDisabled(true);
    scrollToBottom();
  };

  /* Stream Event Handlers */

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    appendMessage("assistant", "");
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta: { value?: string}) => {
    if (delta.value != null) {
      // Check if we're inside a code block
      console.log('delta.value', delta.value);
      if (delta.value.includes('```')) {
        setCurrentCodeBlock(prev => {
          const newBlock = prev + delta.value;
          // If we've found a complete code block, save it
          if (newBlock.split('```').length >= 3) {
            const codeMatch = newBlock.match(/```(?:tsx|jsx)?\n?([\s\S]*?)```/);
            const extractedCode = codeMatch?.[1]?.trim();
            
            if (extractedCode) {
              // Save the code block
              fetch('/api/save-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  threadId,
                  extractedCode,
                  userId: 'user-123', // replace with session
                }),
              });
            }
            return ''; // Reset the code block
          }
          return newBlock;
        });
      }

      // Only append non-code content to the message
      if (!currentCodeBlock) {
        appendToLastMessage(delta.value);
      }
    }
  };

  // imageFileDone - show image in chat
  const handleImageFileDone = (image: { file_id: string }) => {
    appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  }

  // toolCallCreated - log new tool call
  const toolCallCreated = (toolCall: { type: string }) => {
    if (toolCall.type != "code_interpreter") return;
    appendMessage("assistant", "");
  };

  // toolCallDelta - log delta and snapshot for the tool call
  const toolCallDelta = (delta: { type: string; code_interpreter?: { input?: string } }) => {
    if (delta.type != "code_interpreter") return;
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
        console.log('result', result);
        console.log('toolCall', toolCall);
        return { output: result, tool_call_id: toolCall.id, tool_call_name: toolCall.function.name, args: toolCall.function.arguments };
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
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);

    // image
    stream.on("imageFileDone", handleImageFileDone);

    // code interpreter
    stream.on("toolCallCreated", toolCallCreated);
    stream.on("toolCallDelta", toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") handleRunCompleted();
    });
  };

  /*
    =======================
    === Utility Helpers ===
    =======================
  */

  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role: "user" | "assistant", text: string) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col-reverse">
        <div className="flex flex-col">
          {messages.map((msg, index) => (
            <Message key={index} role={msg.role} text={msg.text} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full p-2.5 pb-10"
      >
        <input
          type="text"
          className="flex-grow px-6 py-4 mr-2.5 rounded-[60px] border-2 border-transparent text-base bg-[#efefef] focus:outline-none focus:border-black focus:bg-white"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your question"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-black text-white border-none text-base rounded-[60px] disabled:bg-gray-300"
          disabled={inputDisabled}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
