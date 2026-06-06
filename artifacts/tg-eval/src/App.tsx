import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EvaluationProvider } from "@/context/EvaluationContext";

import ChecklistSelection from "@/pages/ChecklistSelection";
import EmployeeSelection from "@/pages/EmployeeSelection";
import EvaluationForm from "@/pages/EvaluationForm";
import Results from "@/pages/Results";
import History from "@/pages/History";
import EvaluationDetails from "@/pages/EvaluationDetails";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={ChecklistSelection} />
        <Route path="/employees" component={EmployeeSelection} />
        <Route path="/evaluate" component={EvaluationForm} />
        <Route path="/results" component={Results} />
        <Route path="/history" component={History} />
        <Route path="/history/:id" component={EvaluationDetails} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EvaluationProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-[100dvh] bg-muted/20">
              <Router />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </EvaluationProvider>
    </QueryClientProvider>
  );
}

export default App;
