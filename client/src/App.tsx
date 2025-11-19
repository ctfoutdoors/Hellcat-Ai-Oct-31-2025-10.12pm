import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import InventoryLive from "./pages/InventoryLive";
import ProductsManagement from "./pages/ProductsManagement";
import Cases from "./pages/Cases";
import AllCases from "./pages/AllCases";
import ImportCases from "./pages/ImportCases";
import Templates from "./pages/Templates";
import CasesSettings from "./pages/CasesSettings";
import CaseTemplates from "./pages/CaseTemplates";
import CaseSettings from "./pages/CaseSettings";
import NewCase from "./pages/NewCase";
import CaseDetail from "./pages/CaseDetail";
import Orders from "./pages/Orders";
import OrdersManagement from "./pages/OrdersManagement";
import OrderDetail from "./pages/OrderDetail";
import OrdersByChannel from "./pages/OrdersByChannel";
import Inventory from "./pages/Inventory";
import InventoryManagement from "./pages/InventoryManagement";
import PurchaseOrders from "./pages/PurchaseOrders";
import Receiving from "./pages/Receiving";
import StockLevels from "./pages/StockLevels";
import Reports from "./pages/Reports";
import WeeklyReports from "./pages/WeeklyReports";
import PerformanceReports from "./pages/PerformanceReports";
import CRMContacts from "./pages/CRMContacts";
import CRMCompanies from "./pages/CRMCompanies";
import CRMDeals from "./pages/CRMDeals";
import CRMAnalytics from "./pages/CRMAnalytics";
import CustomersList from "./pages/crm/CustomersList";
import LeadsList from "./pages/crm/LeadsList";
import VendorsList from "./pages/crm/VendorsList";
import Customers from "./pages/crm/Customers";
import CustomerProfile from "./pages/crm/CustomerProfile";
import CustomerNew from "./pages/crm/CustomerNew";
import CustomerDetail from "./pages/crm/CustomerDetail";
import Vendors from "./pages/crm/Vendors";
import VendorDetailNew from "./pages/crm/VendorDetailNew";
import ActionItemsDashboard from "./pages/crm/ActionItemsDashboard";
import PODetail from "./pages/po/PODetail";
import Leads from "./pages/crm/Leads";
import LeadDetail from "./pages/crm/LeadDetail";
import EmailTemplates from "./pages/crm/EmailTemplates";
import Calendar from "./pages/Calendar";
import ProductCard from "./pages/inventory/ProductCard";
import WooCommerceProducts from "./pages/inventory/WooCommerceProducts";
import ShipStationInventory from "./pages/inventory/ShipStationInventory";
import Settings from "./pages/Settings";
import EmailAccountsSettings from "./pages/EmailAccountsSettings";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import BrandIntelligence from "./pages/BrandIntelligence";
import CompetitorIntelligence from "./pages/CompetitorIntelligence";
import ProductIntelligence from "./pages/ProductIntelligence";
import MarketIntelligence from "./pages/MarketIntelligence";
import CustomerIntelligence from "./pages/CustomerIntelligence";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import IntelligenceSettings from "./pages/intelligence/Settings";
import IntelligenceProductIntelligence from "./pages/intelligence/ProductIntelligence";
import VariantIntelligence from "./pages/intelligence/VariantIntelligence";
import InventoryIntelligence from "./pages/intelligence/InventoryIntelligence";
import LaunchOrchestrator from "./pages/intelligence/LaunchOrchestrator";
import MissionControl from "./pages/intelligence/MissionControl";
import IntelligenceTemplates from "./pages/intelligence/Templates";
import InvoiceOCR from "./pages/InvoiceOCR";
import ImportExport from "./pages/ImportExport";
import ShipStationAutoImport from "./pages/ShipStationAutoImport";
import Analytics from "./pages/Analytics";
import SmartPredictions from "./pages/SmartPredictions";
import AuditTrail from "./pages/AuditTrail";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        {/* Cases Module */}
        <Route path="/cases" component={AllCases} />
        <Route path="/cases/new" component={NewCase} />
        <Route path="/cases/:id" component={CaseDetail} />
        <Route path="/import-cases" component={ImportCases} />
      <Route path="/templates" component={Templates} />   <Route path="/cases/templates" component={CaseTemplates} />
        <Route path="/cases/settings" component={CasesSettings} />
        
        {/* Orders Module */}
        <Route path="/orders" component={OrdersManagement} />
        <Route path="/orders/:channel" component={OrdersByChannel} />
        <Route path="/order/:id" component={OrderDetail} />
        
        {/* Inventory Module */}
        <Route path="/inventory" component={Inventory} />
        <Route path="/inventory/products/:id" component={ProductCard} />
        <Route path="/inventory/source/woocommerce" component={WooCommerceProducts} />
        <Route path="/inventory/source/shipstation" component={ShipStationInventory} />        <Route path="/inventory" component={InventoryDashboard} />
        <Route path="/inventory/stock-levels" component={StockLevels} />
        <Route path="/inventory/products" component={ProductsManagement} />
        <Route path="/inventory/purchase-orders" component={PurchaseOrders} />
        <Route path="/purchase-orders" component={PurchaseOrders} />
        <Route path="/invoice-ocr" component={InvoiceOCR} />
        <Route path="/import-export" component={ImportExport} />
        <Route path="/shipstation-auto-import" component={ShipStationAutoImport} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/smart-predictions" component={SmartPredictions} />
      <Route path="/audit-trail" component={AuditTrail} />
        <Route path="/inventory/receiving" component={Receiving} />
        
        {/* Reports Module */}
        <Route path="/reports" component={Reports} />
        <Route path="/reports/weekly" component={WeeklyReports} />
        <Route path="/reports/performance" component={PerformanceReports} />
        
        {/* CRM Module */}
        <Route path="/crm/contacts" component={CRMContacts} />
        <Route path="/crm/companies" component={CRMCompanies} />
        <Route path="/crm/deals" component={CRMDeals} />
        <Route path="/crm/analytics" component={CRMAnalytics} />
      <Route path="/crm/customers-old" component={CustomersList} />
      <Route path="/crm/customers" component={Customers} />
      <Route path="/crm/customers/new" component={CustomerNew} />
      <Route path="/crm/customers/:id" component={CustomerDetail} />
      <Route path="/crm/leads-old" component={LeadsList} />
      <Route path="/crm/leads" component={Leads} />
      <Route path="/crm/leads/:id" component={LeadDetail} />
      <Route path="/crm/email-templates" component={EmailTemplates} />
      <Route path="/crm/vendors-old" component={VendorsList} />
      <Route path="/crm/vendors" component={Vendors} />
      <Route path="/crm/vendors/:id" component={VendorDetailNew} />
      <Route path="/crm/action-items" component={ActionItemsDashboard} />
      <Route path="/po/:id" component={PODetail} />
      <Route path="/calendar" component={Calendar} />
        
        {/* Intelligence Module - Legacy */}
        <Route path="/intelligence/brand" component={BrandIntelligence} />
        <Route path="/intelligence/competitor" component={CompetitorIntelligence} />
        <Route path="/intelligence/product-old" component={ProductIntelligence} />
        <Route path="/intelligence/market" component={MarketIntelligence} />
        <Route path="/intelligence/customer" component={CustomerIntelligence} />
        <Route path="/intelligence/threat" component={ThreatIntelligence} />
        
        {/* Intelligence Suite - New Multi-Module System */}
        <Route path="/intelligence/settings" component={IntelligenceSettings} />
        <Route path="/intelligence/product" component={IntelligenceProductIntelligence} />
        <Route path="/intelligence/variant" component={VariantIntelligence} />
        <Route path="/intelligence/inventory" component={InventoryIntelligence} />
        <Route path="/intelligence/orchestrator" component={LaunchOrchestrator} />
        <Route path="/intelligence/mission-control" component={MissionControl} />
        <Route path="/intelligence/templates" component={IntelligenceTemplates} />
        
               {/* Settings */}
        <Route path="/settings" component={Settings} />
        <Route path="/settings/email-accounts" component={EmailAccountsSettings} />
        <Route path="/settings/integrations" component={SettingsIntegrations} />
        <Route path="/settings/email-templates" component={Settings} />
        <Route path="/settings/integrations" component={Settings} />
        
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="hellcat">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
