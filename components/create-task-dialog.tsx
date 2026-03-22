"use client";

import { useState, useEffect } from "react";
import { X, Plus, Clock3, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createManualTask } from "@/services/study-service";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultDate?: string;
}

export function CreateTaskDialog({ isOpen, onClose, onSuccess, defaultDate }: CreateTaskDialogProps) {
  const getTodayIso = () => new Date().toISOString().split('T')[0];

  const [taskName, setTaskName] = useState("");
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [suggestedDay, setSuggestedDay] = useState(defaultDate || getTodayIso());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuggestedDay(defaultDate || getTodayIso());
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !subject.trim()) {
      toast.error("Task name and subject are required.");
      return;
    }

    try {
      setLoading(true);
      await createManualTask({
        taskName,
        subject,
        startTime: startTime || null,
        endTime: endTime || null,
        suggestedDay,
      });
      toast.success("Task added successfully.");
      setTaskName("");
      setStartTime("");
      setEndTime("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Manual Task Entry</h2>
            <p className="text-sm text-slate-400">Schedule a specific time slot for your work.</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Task Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Read Chapter 4"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Subject</label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology 101"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Target Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={suggestedDay}
                  onChange={(e) => setSuggestedDay(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Start Time</label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">End Time</label>
            <div className="relative">
              <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {loading ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
