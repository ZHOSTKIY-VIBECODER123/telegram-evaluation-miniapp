import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function History() {
  const [, setLocation] = useLocation();
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setEvaluations(data || []);
      }
    }

    loadData();
  }, []);

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <header className="py-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          История оценок
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Все проведённые оценки
        </p>
      </header>

      {evaluations.length === 0 && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Оценки пока не проводились.
        </div>
      )}

      {evaluations.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
          onClick={() => setLocation(`/history/${item.id}`)}
        >
          <CardContent className="p-4">
            <div className="font-semibold">
              {item.evaluator_name} → {item.employee_name}
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              {item.checklist_name}
            </div>

            <div className="mt-2 font-medium">
              Средний балл: {item.average_score}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
