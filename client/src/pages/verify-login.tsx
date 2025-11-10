import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyLogin() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  const verifyMagicLink = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/auth/verify-magic-link?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setTimeout(() => {
        window.location.href = '/supplier-dashboard';
      }, 2000);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMagicLink.mutate(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invalid Login Link</h1>
          <Alert variant="destructive" data-testid="alert-invalid-link">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This login link is invalid or malformed. Please request a new login link.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setLocation("/")} data-testid="button-return-home">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (verifyMagicLink.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" data-testid="loader-verifying" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verifying Your Login Link...</h1>
          <p className="text-muted-foreground">Please wait while we log you in securely.</p>
        </div>
      </div>
    );
  }

  if (verifyMagicLink.error) {
    const error = verifyMagicLink.error as any;
    const isExpired = error?.response?.data?.expired === true;
    const errorMessage = error?.response?.data?.message || "An error occurred during verification.";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isExpired ? "Login Link Expired" : "Verification Failed"}
          </h1>
          <Alert variant="destructive" data-testid="alert-verification-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="space-y-3">
            {isExpired && (
              <p className="text-sm text-muted-foreground">
                Login links expire after 15 minutes for security. Please request a new one.
              </p>
            )}
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-request-new-link">
              Request New Login Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verifyMagicLink.isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" data-testid="icon-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Login Successful!</h1>
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" data-testid="alert-success">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              You've been securely logged in. Redirecting to your supplier dashboard...
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
