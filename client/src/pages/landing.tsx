import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function Landing() {
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  
  // Only check auth status once on mount to detect access denied errors
  const { error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: false, // Don't auto-fetch, we'll check manually
    staleTime: 0,
  });

  // Check for access denied error on mount (from login redirect)
  useEffect(() => {
    const errorResponse = error as any;
    if (errorResponse?.response?.status === 403) {
      setAccessDeniedError(
        errorResponse?.response?.data?.message || 
        "Access denied. Only registered suppliers can access this portal."
      );
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">
            <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-admin-login">
                  Admin Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Admin Login</DialogTitle>
                  <DialogDescription>
                    Sign in with your admin credentials to access the full system
                  </DialogDescription>
                </DialogHeader>
                <AdminLoginForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-8">
              <div className="h-16 w-16 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">EF</span>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-foreground">
              Essential Flavours
            </h1>
            
            <p className="text-2xl text-muted-foreground">
              Supplier Quotation Portal
            </p>
          </div>

          {accessDeniedError && (
            <Alert variant="destructive" className="text-left" data-testid="alert-access-denied">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{accessDeniedError}</AlertDescription>
            </Alert>
          )}

          <Alert className="text-left bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="alert-info">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>For Suppliers:</strong> You must be registered in our supplier directory to access this portal. 
              If you've received a quote request email from us, you can use the link in that email to submit your quote without logging in.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center pt-8">
            <Button 
              size="lg" 
              asChild 
              data-testid="button-supplier-login"
              className="text-lg px-12 py-6 h-auto"
            >
              <a href="/api/login">
                Supplier Login
              </a>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t border-border pt-8 mt-16">
            <p>Essential Flavours Supplier Portal • Secure Procurement Management</p>
          </div>
        </div>
      </main>
    </div>
  );
}
