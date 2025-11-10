import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { setPasswordSchema } from '@shared/passwordValidation';
import type { z } from 'zod';

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

export default function SetPassword() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/set-password');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const token = new URLSearchParams(window.location.search).get('token');

  const form = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const verifyTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/auth/verify-setup-token?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid or expired token');
      }
      return response.json();
    },
    onSuccess: () => {
      setVerifying(false);
      setTokenError(null);
    },
    onError: (error: Error) => {
      setVerifying(false);
      setTokenError(error.message);
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: SetPasswordFormData) => {
      return apiRequest(
        `/api/auth/setup-password?token=${encodeURIComponent(token!)}`,
        'POST',
        { password: data.password }
      );
    },
    onSuccess: () => {
      setSuccessMessage('Password set successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    },
    onError: (error: Error) => {
      form.setError('root', {
        message: error.message || 'Failed to set password. Please try again.',
      });
    },
  });

  useEffect(() => {
    if (token) {
      verifyTokenMutation.mutate(token);
    } else {
      setVerifying(false);
      setTokenError('No token provided. Please use the link from your email.');
    }
  }, [token]);

  const onSubmit = (data: SetPasswordFormData) => {
    setPasswordMutation.mutate(data);
  };

  const password = form.watch('password');
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-center">Set Your Password</CardTitle>
          <CardDescription className="text-center">
            Create a secure password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <div className="text-center py-8" data-testid="status-verifying">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Verifying your setup link...</p>
            </div>
          ) : tokenError ? (
            <Alert variant="destructive" data-testid="alert-token-error">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{tokenError}</AlertDescription>
            </Alert>
          ) : successMessage ? (
            <Alert className="bg-green-50 text-green-900 border-green-200" data-testid="alert-success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root && (
                  <Alert variant="destructive" data-testid="alert-form-error">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            disabled={setPasswordMutation.isPending}
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            disabled={setPasswordMutation.isPending}
                            data-testid="input-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Password Requirements:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2" data-testid="requirement-length">
                      {hasMinLength ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={hasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                        At least 12 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-2" data-testid="requirement-uppercase">
                      {hasUppercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={hasUppercase ? 'text-green-600' : 'text-muted-foreground'}>
                        One uppercase letter
                      </span>
                    </li>
                    <li className="flex items-center gap-2" data-testid="requirement-lowercase">
                      {hasLowercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={hasLowercase ? 'text-green-600' : 'text-muted-foreground'}>
                        One lowercase letter
                      </span>
                    </li>
                    <li className="flex items-center gap-2" data-testid="requirement-number">
                      {hasNumber ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                        One number
                      </span>
                    </li>
                    <li className="flex items-center gap-2" data-testid="requirement-special">
                      {hasSpecial ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={hasSpecial ? 'text-green-600' : 'text-muted-foreground'}>
                        One special character
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={setPasswordMutation.isPending}
                  data-testid="button-submit"
                >
                  {setPasswordMutation.isPending ? 'Setting password...' : 'Set Password'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
