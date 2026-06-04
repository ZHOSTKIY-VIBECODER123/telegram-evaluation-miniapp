import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Search } from "lucide-react";
import { useEvaluation } from "@/context/EvaluationContext";
import { useEmployees } from "@/hooks/useEmployees";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";

export default function EmployeeSelection() {
  const [, setLocation] = useLocation();
  const {
    selectedChecklist,
    setSelectedEmployee,
    selectedEvaluator,
    setSelectedEvaluator,
  } = useEvaluation();
  const [searchQuery, setSearchQuery] = useState("");
  const { employees, loading, error } = useEmployees();

  const evaluators = employees.filter((e) => e.canEvaluate);

  if (!selectedChecklist) {
    setLocation("/");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setLocation("/evaluate");
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!selectedEvaluator) return false;

    if (selectedEvaluator.role === "Team Leader") {
      return emp.role === "Менеджер по привлечению партнеров";
    }
    if (selectedEvaluator.name === "Диер О") {
      return emp.role === "Team Leader";
    }
    if (selectedEvaluator.name === "Азамат") {
      return emp.name === "Диер О";
    }

    return false;
  }).filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("SELECTED:", selectedEvaluator);
  console.log("EMPLOYEES:", employees);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
      className="max-w-[430px] mx-auto min-h-[100dvh] bg-background flex flex-col"
    >
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setLocation("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Select Employee</h1>
            <p className="text-xs text-primary font-medium truncate">{selectedChecklist.name}</p>
          </div>
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">
            Кто проводит оценку
          </label>
          <select
            className="w-full mt-2 border rounded-md p-2"
            value={selectedEvaluator?.id || ""}
            onChange={(e) => {
              const evaluator = evaluators.find((x) => x.id === e.target.value);
              if (evaluator) setSelectedEvaluator(evaluator);
            }}
            data-testid="select-evaluator"
          >
            <option value="">Выберите сотрудника</option>
            {evaluators.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {loading && (
          <div className="text-center py-8">
            Загрузка сотрудников...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && !selectedEvaluator && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Выберите сотрудника, который проводит оценку
          </div>
        )}

        {!loading && !error && selectedEvaluator && (
          filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees found
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <Card
                key={employee.id}
                className="p-3 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
                onClick={() => handleSelect(employee)}
                data-testid={`card-employee-${employee.id}`}
              >
                <EmployeeAvatar name={employee.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                </div>
              </Card>
            ))
          )
        )}
      </div>
    </motion.div>
  );
}
