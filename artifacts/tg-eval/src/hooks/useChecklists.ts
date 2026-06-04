import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { DbChecklistWithNested } from "@/lib/supabaseTypes";
import { Checklist } from "@/data/mockData";

function mapToChecklist(row: DbChecklistWithNested): Checklist {
  const sections = [...(row.checklist_sections || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const questions = sections.flatMap((section) =>
    [...(section.checklist_questions || [])].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    ).map((q) => q.text)
  );

  return {
    id: String(row.id),
    name: row.name,
    category: row.category ?? "General",
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
          .select(
            `*, checklist_sections(*, checklist_questions(*))`
          )
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
