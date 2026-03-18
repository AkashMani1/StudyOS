"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, Input, SectionHeading } from "@/components/ui";
import type { StudentAdminRow } from "@/types/domain";

export function AdminStudentTable({ rows }: { rows: StudentAdminRow[] }) {
  const router = useRouter();
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const subjectMatch = subjectFilter
          ? row.subjects.some((subject) => subject.toLowerCase().includes(subjectFilter.toLowerCase()))
          : true;
        const dateMatch = dateRange ? row.lastActive.includes(dateRange) : true;
        return subjectMatch && dateMatch;
      }),
    [dateRange, rows, subjectFilter]
  );

  const exportCsv = () => {
    const csv = Papa.unparse(filteredRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "studyos-admin-export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const addStudent = async () => {
    try {
      const response = await fetch("/api/admin/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: studentEmail })
      });

      if (!response.ok) {
        throw new Error("Unable to add student.");
      }

      setStudentEmail("");
      router.refresh();
      toast.success("Student linked to institute.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add student.");
    }
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          eyebrow="Institute dashboard"
          title="Student performance table"
          description="Filter by subject or rough last-active date, then export a CSV snapshot locally."
        />
        <Button onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
          placeholder="Filter by subject"
        />
        <Input
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value)}
          placeholder="Filter by last active date"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr,auto]">
        <Input
          value={studentEmail}
          onChange={(event) => setStudentEmail(event.target.value)}
          placeholder="Add student by email"
          type="email"
        />
        <Button onClick={() => void addStudent()}>Add student</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Completion %</th>
              <th className="pb-3">Streak</th>
              <th className="pb-3">Coins</th>
              <th className="pb-3">Last active</th>
              <th className="pb-3">Subjects</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.uid} className="border-t border-white/10">
                <td className="py-4 font-semibold">{row.name}</td>
                <td className="py-4">{row.email}</td>
                <td className="py-4">{row.completionPercentage}%</td>
                <td className="py-4">{row.streak}</td>
                <td className="py-4">{row.coins}</td>
                <td className="py-4">{row.lastActive}</td>
                <td className="py-4">{row.subjects.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
