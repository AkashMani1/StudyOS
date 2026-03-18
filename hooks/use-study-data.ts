"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type {
  DailyPlanDoc,
  GoalDoc,
  SessionDoc,
  TaskDoc,
  WeeklyInsightDoc
} from "@/types/domain";

interface StudyCollections {
  goals: GoalDoc[];
  tasks: TaskDoc[];
  sessions: SessionDoc[];
  dailyPlans: DailyPlanDoc[];
  insights: WeeklyInsightDoc[];
  loading: boolean;
}

export function useStudyData(): StudyCollections {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalDoc[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlanDoc[]>([]);
  const [insights, setInsights] = useState<WeeklyInsightDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setTasks([]);
      setSessions([]);
      setDailyPlans([]);
      setInsights([]);
      setLoading(false);
      return;
    }

    const unsubscribers: Unsubscribe[] = [];

    unsubscribers.push(
      onSnapshot(collection(db, "users", user.uid, "goals"), (snapshot) => {
        setGoals(snapshot.docs.map((entry) => entry.data() as GoalDoc));
      })
    );
    unsubscribers.push(
      onSnapshot(query(collection(db, "users", user.uid, "tasks"), orderBy("suggestedDay", "asc")), (snapshot) => {
        setTasks(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<TaskDoc, "id">)
          }))
        );
      })
    );
    unsubscribers.push(
      onSnapshot(collection(db, "users", user.uid, "sessions"), (snapshot) => {
        setSessions(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<SessionDoc, "id">)
          }))
        );
      })
    );
    unsubscribers.push(
      onSnapshot(collection(db, "users", user.uid, "dailyPlans"), (snapshot) => {
        setDailyPlans(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<DailyPlanDoc, "id">)
          }))
        );
      })
    );
    unsubscribers.push(
      onSnapshot(query(collection(db, "users", user.uid, "insights"), orderBy("generatedAt", "desc")), (snapshot) => {
        setInsights(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<WeeklyInsightDoc, "id">)
          }))
        );
        setLoading(false);
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  return useMemo(
    () => ({
      goals,
      tasks,
      sessions,
      dailyPlans,
      insights,
      loading
    }),
    [dailyPlans, goals, insights, loading, sessions, tasks]
  );
}
