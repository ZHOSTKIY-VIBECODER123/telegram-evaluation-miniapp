import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { Checklist } from "@/data/mockData";
import { useChecklists } from "@/hooks/useChecklists";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ChecklistSelection() {
  const [, setLocation] = useLocation();
  const { setSelectedChecklist } = useEvaluation();
  const { checklists, loading, error } = useChecklists();

  const handleSelect = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setLocation("/employees");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] bg-background p-4 flex flex-col gap-4"
    >
      <header className="py-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Select Checklist
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose a template to begin evaluation
        </p>
      </header>

      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => setLocation("/history")}
      >
        История оценок
      </Button>

      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => setLocation("/dashboard")}
      >
        Аналитика сотрудников
      </Button>

      {loading && (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load checklists</p>
            <p className="mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && checklists.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          No checklists found.
        </div>
      )}

      {!loading && !error && checklists.length > 0 && (
        <div className="flex flex-col gap-3">
          {checklists.map((checklist) => (
            <Card
              key={checklist.id}
              className="cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
              onClick={() => handleSelect(checklist)}
              data-testid={`card-checklist-${checklist.id}`}
            >
              <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg">{checklist.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {checklist.questions.length} questions
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {checklist.category}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
