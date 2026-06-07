import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const SCORE_COLORS: Record<number, string> = {
  0: "bg-red-100 text-red-700",
  1: "bg-orange-100 text-orange-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-green-100 text-green-700",
};

export default function EvaluationDetails() {
  const [, params] = useRoute("/history/:id");
  const [, setLocation] = useLocation();
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    async function loadEvaluation() {
      if (!params?.id) return;
      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .eq("id", params.id)
        .single();
      if (data) setEvaluation(data);
    }
    loadEvaluation();
  }, [params]);

  if (!evaluation) {
    return (
      <div className="max-w-[430px] mx-auto p-4 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  const answers: any[] = Array.isArray(evaluation.answers)
    ? evaluation.answers
    : Object.values(evaluation.answers || {});

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <Button
        variant="ghost"
        className="mb-2 -ml-2"
        onClick={() => setLocation("/history")}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад
      </Button>

      <h1 className="text-2xl font-bold">Детали оценки</h1>

      <Card>
        <CardContent className="p-4 space-y-1">
          <p>
            <strong>Оценщик:</strong> {evaluation.evaluator_name || "—"}
          </p>
          <p>
            <strong>Сотрудник:</strong> {evaluation.employee_name}
          </p>
          <p>
            <strong>Чек-лист:</strong> {evaluation.checklist_name}
          </p>
          <p>
            <strong>Дата:</strong>{" "}
            {new Date(evaluation.created_at).toLocaleString()}
          </p>
          <p>
            <strong>Средний балл:</strong> {evaluation.average_score}
          </p>
        </CardContent>
      </Card>

      <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider px-1">
        Ответы
      </h2>

      {answers.map((answer: any, idx: number) => (
        <Card key={idx}>
          <CardContent className="p-4">
            <div className="flex gap-3 items-start">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  answer.score !== null && answer.score !== undefined
                    ? SCORE_COLORS[answer.score] ?? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {answer.score ?? "—"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">
                  {answer.question || `Вопрос #${idx + 1}`}
                </p>
                {answer.comment && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    "{answer.comment}"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
