import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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

      if (data) {
        setEvaluation(data);
      }
    }

    loadEvaluation();
  }, [params]);

  if (!evaluation) {
    return (
      <div className="max-w-[430px] mx-auto p-4">
        Загрузка...
      </div>
    );
  }

  const answers = evaluation.answers || {};

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
      <h1 className="text-2xl font-bold">
        Детали оценки
      </h1>

      <Card>
        <CardContent className="p-4">
          <p><strong>Оценщик:</strong> {evaluation.evaluator_name}</p>
          <p><strong>Сотрудник:</strong> {evaluation.employee_name}</p>
          <p><strong>Чек-лист:</strong> {evaluation.checklist_name}</p>
          <p><strong>Средний балл:</strong> {evaluation.average_score}</p>
        </CardContent>
      </Card>

      {Object.entries(answers).map(([index, answer]: any) => (
        <Card key={index}>
          <CardContent className="p-4">
            <p>
              <strong>Вопрос #{Number(index) + 1}</strong>
            </p>

            <p className="mt-2">
              Оценка: {answer.score}
            </p>

            {answer.comment && (
              <p className="mt-2 text-muted-foreground">
                Комментарий: {answer.comment}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
