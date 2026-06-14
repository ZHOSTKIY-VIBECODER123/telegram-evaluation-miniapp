import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EvaluationProvider } from "@/context/EvaluationContext";
import { CurrentUserProvider, useCurrentUser } from "@/context/CurrentUserContext";
import { AppLayout } from "@/components/AppLayout";

import Auth from "@/pages/Auth";
import ChecklistSelection from "@/pages/ChecklistSelection";
import EmployeeSelection from "@/pages/EmployeeSelection";
import EvaluationForm from "@/pages/EvaluationForm";
import Results from "@/pages/Results";
import History from "@/pages/History";
import EvaluationDetails from "@/pages/EvaluationDetails";
import Dashboard from "@/pages/Dashboard";
import EmployeeAnalytics from "@/pages/EmployeeAnalytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence initial={false}>
      <Switch>
        <Route path="/" component={ChecklistSelection} />
        <Route path="/employees" component={EmployeeSelection} />
        <Route path="/evaluate" component={EvaluationForm} />
        <Route path="/results" component={Results} />
        <Route path="/history" component={History} />
        <Route path="/history/:id" component={EvaluationDetails} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/:employee" component={EmployeeAnalytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

// Гейт авторизации: пока не вошли — показываем экран входа
function Gate() {
  const { currentUser, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(0,122,255,0.2)", borderTopColor: "#007AFF" }} />
      </div>
    );
  }

  if (!currentUser) return <Auth />;

  return (
    <AppLayout>
      <Router />
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <EvaluationProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Gate />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </EvaluationProvider>
      </CurrentUserProvider>
    </QueryClientProvider>
  );
}

export default App;
