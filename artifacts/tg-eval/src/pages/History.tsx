import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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
      <Button
        variant="ghost"
        className="mb-2 -ml-2"
        onClick={() => setLocation("/")}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад
      </Button>
      <h1 className="text-2xl font-bold">История оценок</h1>

      {evaluations.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer hover:border-primary"
          onClick={() => setLocation(`/history/${item.id}`)}
        >
          <CardContent className="p-4">
            <div className="font-semibold">
              {item.evaluator_name} → {item.employee_name}
            </div>

            <div className="text-sm text-muted-foreground">
              {item.checklist_name}
            </div>

            <div className="mt-2">Средний балл: {item.average_score}</div>

            <div className="text-xs text-muted-foreground mt-1">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
