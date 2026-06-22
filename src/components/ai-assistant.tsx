"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: Array<{ type: string; name: string }>;
}

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your Mohalla AI Assistant. Ask me about society parking rules, door-to-door garbage collection, domestic helper rules, quiet hours, or local helpdesk numbers.",
    },
  ]);
  const [isPending, startTransition] = useTransition();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Query streaming API route
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ question: userText })
        });

        if (!response.ok) {
          throw new Error("Failed to query assistant endpoint.");
        }

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedText = "";
        let parsedSources: any[] = [];

        // Create empty AI message node for streaming updates
        const aiMsgId = Math.random().toString();
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, sender: "ai", text: "", sources: [] }
        ]);

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            accumulatedText += chunk;

            // Separate main text and metadata if present
            if (accumulatedText.includes("__METADATA__")) {
              const parts = accumulatedText.split("__METADATA__");
              const mainText = parts[0];
              try {
                parsedSources = JSON.parse(parts[1]).sources;
              } catch (e) {
                // Ignore parse errors on partial JSON chunks
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, text: mainText, sources: parsedSources } : m
                )
              );
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, text: accumulatedText } : m
                )
              );
            }
          }
        }
      } catch (err) {
        const errorMsg: Message = {
          id: Math.random().toString(),
          sender: "ai",
          text: "I'm having trouble connecting right now. Here's a tip: You can reach the main gate security desk at +91 80 5555 1212.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    });
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 text-left">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[330px] sm:w-[380px] h-[480px] select-none"
          >
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl flex flex-col h-full overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black">Mohalla Assistant</CardTitle>
                    <p className="text-[10px] opacity-75 font-semibold">AI Community Guidelines Desk</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>

              {/* Chat log */}
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[360px]">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 max-w-[85%] ${
                        isUser ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                        isUser
                          ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                          : "bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-100 dark:border-zinc-850"
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        
                        {/* Reference Sources displays */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800 flex flex-col gap-1.5">
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">Context References:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((src, sIdx) => (
                                <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black border border-emerald-500/20 capitalize">
                                  {src.name} • {src.type.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isPending && messages[messages.length - 1]?.text === "" && (
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                      <span className="text-[10px] font-semibold">AI is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </CardContent>

              {/* Footer Form */}
              <CardFooter className="p-3 border-t border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/50 shrink-0">
                <form onSubmit={handleSubmit} className="w-full flex gap-2">
                  <Input
                    placeholder="Ask about guidelines, garbage hours..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isPending}
                    className="rounded-xl text-[10px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 h-9"
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !input.trim()}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-3 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 focus:outline-none cursor-pointer border border-emerald-400/20"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5 animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
