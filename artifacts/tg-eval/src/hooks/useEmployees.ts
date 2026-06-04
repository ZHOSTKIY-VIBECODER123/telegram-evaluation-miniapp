import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export interface Employee {
  id: string;
  name: string;
  role: string;
  canEvaluate?: boolean;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await getSupabase()
          .from("employees")
          .select("*")
          .eq("active", true)
          .order("full_name");

        if (error) {
          setError(error.message);
          return;
        }

        setEmployees(
          (data || []).map((e) => ({
            id: String(e.id),
            name: e.full_name,
            role: e.role,
            canEvaluate: e.can_evaluate,
          }))
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load employees");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { employees, loading, error };
}
