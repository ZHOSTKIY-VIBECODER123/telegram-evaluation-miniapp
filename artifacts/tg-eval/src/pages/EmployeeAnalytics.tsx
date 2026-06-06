import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function EmployeeAnalytics() {
  const [, params] = useRoute("/dashboard/:employee");
  const [, setLocation] = useLocation();

  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!params?.employee) return;

      const employeeName = decodeURIComponent(params.employee);

      const { data } = await getSupabase()
        .from("evaluation_results")
        .select("*")
        .eq("employee_name", employeeName)
        .order("created_at", { ascending: false });

      setEvaluations(data || []);
    }

    loadData();
  }, [params]);

  if (!params?.employee) return null;

  const employeeName = decodeURIComponent(params.employee);

  return (
    <div className="max-w-[430px] mx-auto p-4 space-y-4">
      <Button
        variant="ghost"
        className="mb-2 -ml-2"
        onClick={() => setLocation("/dashboard")}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Назад
      </Button>

      <h1 className="text-2xl font-bold">
        {employeeName}
      </h1>

      {evaluations.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="font-semibold">
              {item.checklist_name}
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              {item.evaluator_name} → {item.employee_name}
            </div>

            <div className="mt-2">
              Средний балл: {item.average_score}
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
