import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import SupplierDashboard from "@/pages/supplier-dashboard";
import UserManagement from "@/pages/user-management";
import Suppliers from "@/pages/suppliers";
import QuoteRequests from "@/pages/quote-requests";
import CreateQuoteRequest from "@/pages/create-quote-request";
import QuoteRequestDetail from "@/pages/quote-request-detail";
import QuoteDetail from "@/pages/quote-detail";
import QuoteSubmission from "@/pages/quote-submission";
import SupplierQuoteDetail from "@/pages/supplier-quote-detail";
import VerifyLogin from "@/pages/verify-login";
import SetPassword from "@/pages/set-password";
import ApproveSupplier from "@/pages/approve-supplier";
import SupplierApplications from "@/pages/supplier-applications";
import SupplierApplicationDetail from "@/pages/supplier-application-detail";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/quote-submission/:id" component={QuoteSubmission} />
      <Route path="/verify-login" component={VerifyLogin} />
      <Route path="/set-password" component={SetPassword} />
    </Switch>
  );
}

function SupplierQuoteRequestsGuard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Invalid Link",
      description: "The quote request link appears to be incomplete. Please check your email or access quotes from your dashboard.",
      variant: "destructive",
    });
    navigate('/supplier/dashboard');
  }, [navigate, toast]);

  return null;
}

function AuthenticatedRouter() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'procurement';
  const isSupplier = user?.role === 'supplier';

  return (
    <Switch>
      <Route path="/" component={isAdmin ? AdminDashboard : SupplierDashboard} />
      {isAdmin && <Route path="/suppliers" component={Suppliers} />}
      {isAdmin && <Route path="/quote-requests" component={QuoteRequests} />}
      {isAdmin && <Route path="/quote-requests/create" component={CreateQuoteRequest} />}
      {isAdmin && <Route path="/quote-requests/:requestId/quotes/:quoteId" component={QuoteDetail} />}
      {isAdmin && <Route path="/quote-requests/:id" component={QuoteRequestDetail} />}
      {isAdmin && <Route path="/approve-supplier" component={ApproveSupplier} />}
      {isAdmin && <Route path="/supplier-applications" component={SupplierApplications} />}
      {isAdmin && <Route path="/supplier-applications/:id" component={SupplierApplicationDetail} />}
      {isAdmin && <Route path="/users" component={UserManagement} />}
      {/* Supplier routes */}
      <Route path="/supplier/dashboard" component={SupplierDashboard} />
      <Route path="/supplier/quote-requests" component={SupplierQuoteRequestsGuard} />
      <Route path="/supplier/quote-requests/:requestId" component={SupplierQuoteDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Demo mode: All routes are publicly accessible
  // Public routes that don't require authentication
  if (location.startsWith('/quote-submission/') || location.startsWith('/verify-login') || location.startsWith('/set-password')) {
    return <PublicRouter />;
  }

  // In demo mode, always show authenticated router
  return <AuthenticatedRouter />;
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'procurement';

  // Demo mode: Always show sidebar layout
  if (isAuthenticated) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b border-border">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                {isAdmin && <NotificationBell />}
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
