import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { Checklist, ChecklistSection } from "@/data/mockData";

type DbQuestion = { id: number; question_text: string; sort_order: number };
type DbSection = { id: number; name: string; sort_order: number; checklist_questions: DbQuestion[] };
type DbChecklistWithNested = { id: number; name: string; checklist_sections: DbSection[] };

function mapToChecklist(row: DbChecklistWithNested): Checklist {
  const sortedSections = [...(row.checklist_sections || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const sections: ChecklistSection[] = sortedSections.map((sec) => ({
    id: String(sec.id),
    title: sec.name ?? "Раздел",
    questions: [...(sec.checklist_questions || [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((q) => q.question_text),
  }));

  const questions = sections.flatMap((s) => s.questions);

  return {
    id: String(row.id),
    name: row.name,
    category: "Evaluation",
    sections,
    questions,
  };
}

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await getSupabase()
          .from("checklists")
          .select("*, checklist_sections(*, checklist_questions(*))")
          .order("id");

        if (sbError) {
          setError(sbError.message);
          return;
        }

        setChecklists((data as DbChecklistWithNested[]).map(mapToChecklist));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load checklists");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { checklists, loading, error };
}
