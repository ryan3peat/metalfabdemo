import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function SupplierLoginForm() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const requestMagicLink = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/auth/request-magic-link', 'POST', { email });
      return await response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      requestMagicLink.mutate(email.trim());
    }
  };

  if (showSuccess) {
    return (
      <div className="space-y-4" data-testid="success-message">
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>Check your email!</strong> If an account exists with that email address, we've sent you a login link. 
            The link will expire in 15 minutes.
          </AlertDescription>
        </Alert>
        
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Didn't receive the email?</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSuccess(false)}
            data-testid="button-try-again"
          >
            Try Another Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="supplier-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="supplier-email"
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={requestMagicLink.isPending}
            className="pl-10"
            data-testid="input-supplier-email"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the email address associated with your supplier account
        </p>
      </div>

      {requestMagicLink.error && (
        <Alert variant="destructive" data-testid="alert-error">
          <AlertDescription>
            {(requestMagicLink.error as any)?.message || "An error occurred. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={requestMagicLink.isPending || !email.trim()}
        data-testid="button-send-login-link"
      >
        {requestMagicLink.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Login Link
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>We'll send you a secure login link via email.</p>
        <p className="mt-1">No password needed!</p>
      </div>
    </form>
  );
}
