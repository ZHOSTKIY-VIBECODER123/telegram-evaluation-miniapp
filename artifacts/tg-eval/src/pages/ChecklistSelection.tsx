import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEvaluation } from "@/context/EvaluationContext";
import { CHECKLISTS } from "@/data/mockData";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChecklistSelection() {
  const [, setLocation] = useLocation();
  const { setSelectedChecklist } = useEvaluation();

  const handleSelect = (checklist: (typeof CHECKLISTS)[0]) => {
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

      <div className="flex flex-col gap-3">
        {CHECKLISTS.map((checklist) => (
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
    </motion.div>
  );
}
