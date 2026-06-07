import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEvaluation } from "@/context/EvaluationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const [, setLocation] = useLocation();
  const {
    selectedChecklist,
    selectedEmployee,
    selectedEvaluator,
    answers,
    reset,
  } = useEvaluation();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedChecklist || !selectedEmployee) {
      setLocation("/");
    }
  }, [selectedChecklist, selectedEmployee, setLocation]);

  if (!selectedChecklist || !selectedEmployee) return null;

  const totalQuestions = selectedChecklist.questions.length;
  const answeredQuestions = Object.values(answers).filter(
    (a) => a.score !== null,
  );

  const totalScore = answeredQuestions.reduce(
    (sum, a) => sum + (a.score || 0),
    0,
  );
  const maxPossibleScore = totalQuestions * 3;
  const averageScore =
    answeredQuestions.length > 0
      ? (totalScore / answeredQuestions.length).toFixed(1)
      : "0.0";
  const percentage =
    maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

  const handleSave = async () => {
    try {
      const { error } = await getSupabase()
        .from("evaluation_results")
        .insert({
          checklist_name: selectedChecklist.name,
          employee_name: selectedEmployee.name,
          employee_role: selectedEmployee.role,
          evaluator_name: selectedEvaluator?.name || "",
          total_score: totalScore,
          average_score: Number(averageScore),
          answers: selectedChecklist.questions.map((question, index) => ({
            question,
            score: answers[index]?.score ?? null,
            comment: answers[index]?.comment ?? "",
          })),
        });

      if (error) {
        throw error;
      }

      try {
        await fetch(
          "https://script.google.com/macros/s/AKfycbzCEPf-2tm_p7rz6hkGvaFa93OQX26uVDvYKVexkvrFzFewLqM06jcu3iodme5VQff72g/exec",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              created_at: new Date().toISOString(),
              evaluator_name: selectedEvaluator?.name || "",
              employee_name: selectedEmployee.name,
              checklist_name: selectedChecklist.name,
              total_score: totalScore,
              average_score: Number(averageScore),
              answers: answers,
            }),
          },
        );
      } catch (sheetError) {
        console.error("Google Sheets error:", sheetError);
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Evaluation Saved",
        description: "The results have been saved to Supabase.",
      });
    } catch (err: unknown) {
      console.error(err);

      toast({
        title: "Save Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleNew = () => {
    reset();
    setLocation("/");
  };

  const getScoreColor = (score: number | null) => {
    switch (score) {
      case 0:
        return "bg-[#EF4444] text-white";
      case 1:
        return "bg-[#F97316] text-white";
      case 2:
        return "bg-[#EAB308] text-white";
      case 3:
        return "bg-[#22C55E] text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] bg-background pb-24"
    >
      <header className="p-6 pb-4 bg-primary text-primary-foreground rounded-b-3xl mb-6 shadow-sm">
        <h1 className="text-center font-bold text-lg opacity-90 mb-4 tracking-wide uppercase">
          EVALUATION RESULTS
        </h1>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
              <path
                className="text-primary-foreground/20"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-white drop-shadow-md"
                strokeDasharray={`${percentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{totalScore}</span>
              <span className="text-sm font-medium opacity-80">
                / {maxPossibleScore}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm font-medium bg-primary-foreground/10 px-4 py-2 rounded-full">
            <span>
              Avg: <strong className="text-lg ml-1">{averageScore}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-6">
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4 flex items-center gap-4">
            <EmployeeAvatar
              name={selectedEmployee.name}
              className="h-14 w-14 border-2 border-background"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">
                {selectedEmployee.name}
              </h2>
              <p className="text-muted-foreground text-sm truncate">
                {selectedEmployee.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Breakdown
          </h3>
          <div className="space-y-3">
            {selectedChecklist.questions.map((question, idx) => {
              const answer = answers[idx];
              return (
                <div
                  key={idx}
                  className="bg-card border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getScoreColor(answer?.score)}`}
                    >
                      {answer?.score ?? "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {question}
                      </p>
                      {answer?.comment && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded-lg italic">
                          "{answer.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-4 bg-background/90 backdrop-blur-md border-t z-20 flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full text-base font-semibold rounded-xl h-12"
          onClick={handleSave}
        >
          Save Evaluation
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full text-base font-semibold rounded-xl h-12 bg-transparent border-border"
          onClick={handleNew}
        >
          Start New Evaluation
        </Button>
      </div>
    </motion.div>
  );
}
