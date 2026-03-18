"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Textarea } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export function CoachChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: "assistant",
      content:
        "You do not need motivation. You need evidence. Ask for a schedule correction, a reality check, or a blunt performance breakdown."
    }
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    if (!user) {
      const nextPrompt = prompt.trim();
      setPrompt("");
      setMessages((current) => [
        ...current,
        { role: "user", content: nextPrompt },
        {
          role: "assistant",
          content:
            "You can explore the coach here, but sign in if you want advice based on your own tasks, misses, and sessions."
        }
      ]);
      toast.error("Sign in to use the live personal coach.");
      return;
    }

    const nextPrompt = prompt.trim();
    setPrompt("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: nextPrompt }]);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: nextPrompt })
      });

      if (!response.ok || !response.body) {
        throw new Error("The coach is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      setMessages((current) => [...current, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        accumulated += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1 ? { ...message, content: accumulated } : message
          )
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coach request failed.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "The coach feed failed. Fallback advice: choose one overdue task, compress it to 25 minutes, and finish it before opening another tab."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-comet">LLM coach</p>
        <h3 className="mt-2 font-display text-2xl font-bold">Harsh, personal, and data-aware</h3>
      </div>

      <div className="space-y-3">
        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              message.role === "assistant"
                ? "rounded-3xl rounded-tl-md bg-slate-950 px-4 py-3 text-sm text-white dark:bg-white/10"
                : "ml-auto max-w-[90%] rounded-3xl rounded-tr-md bg-comet px-4 py-3 text-sm text-white"
            }
          >
            {message.content || (loading ? "Thinking..." : "")}
          </motion.div>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask why your plan keeps collapsing, or request a stricter one."
        />
        <Button className="w-full sm:w-auto" disabled={loading || !prompt.trim()} type="submit">
          <SendHorizontal className="mr-2 h-4 w-4" />
          Ask the coach
        </Button>
      </form>
    </Card>
  );
}
