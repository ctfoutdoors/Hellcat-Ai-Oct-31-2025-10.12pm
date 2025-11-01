import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DensityProvider } from "./contexts/DensityContext";
import { ThemeCustomizerProvider } from "./contexts/ThemeCustomizerContext";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/CasesNew";
import CaseDetail from "./pages/CaseDetail";
import OldCases from "./pages/Cases";
import ImportCases from "./pages/ImportCases";
import SettingsPage from "./pages/Settings";
import OrderMonitoring from "./pages/OrderMonitoring";
import Products from "./pages/Products";
import Certifications from "./pages/Certifications";
import ShipmentAudits from "./pages/ShipmentAudits";
import Reports from "./pages/Reports";
import ThemeColors from "./pages/ThemeColors";
import EmailTemplates from "./pages/EmailTemplates";
import SyncStatus from "./pages/SyncStatus";
import PDFInvoiceScanner from "./pages/PDFInvoiceScanner";
import CaseTemplates from "./pages/CaseTemplates";
import WeeklyReports from "./pages/WeeklyReports";
import Performance from "./pages/Performance";
import Integrations from "./pages/Integrations";
import ContactsList from "./pages/crm/ContactsList";
import ContactDetail from "./pages/crm/ContactDetail";
import CompaniesList from "./pages/crm/CompaniesList";
import DealsPipeline from "./pages/crm/DealsPipeline";
import PredictionsDashboard from "./pages/ai/PredictionsDashboard";
import PrescriptionsQueue from "./pages/ai/PrescriptionsQueue";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cases" component={Cases} />
      <Route path="/cases/:id" component={CaseDetail} />
      <Route path="/import" component={ImportCases} />
      <Route path="/orders" component={OrderMonitoring} />
      <Route path="/products" component={Products} />
      <Route path="/certifications" component={Certifications} />
      <Route path="/audits" component={ShipmentAudits} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/settings/colors" component={ThemeColors} />
      <Route path="/settings/email-templates" component={EmailTemplates} />
      <Route path="/sync-status" component={SyncStatus} />
      <Route path="/pdf-scanner" component={PDFInvoiceScanner} />
      <Route path="/cases/templates" component={CaseTemplates} />
      <Route path="/reports/weekly" component={WeeklyReports} />
      <Route path="/reports/performance" component={Performance} />
      <Route path="/settings/integrations" component={Integrations} />
      <Route path="/crm/contacts/:id" component={ContactDetail} />
      <Route path="/crm/contacts" component={ContactsList} />
      <Route path="/crm/companies" component={CompaniesList} />
      <Route path="/crm/deals" component={DealsPipeline} />
      <Route path="/ai/predictions" component={PredictionsDashboard} />
      <Route path="/ai/prescriptions" component={PrescriptionsQueue} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ThemeCustomizerProvider>
          <DensityProvider defaultDensity="normal">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </DensityProvider>
        </ThemeCustomizerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
