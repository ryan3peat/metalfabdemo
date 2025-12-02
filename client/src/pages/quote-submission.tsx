import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Package, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

type QuoteRequest = {
  id: string;
  requestNumber: string;
  materialName: string;
  materialType: string | null;
  materialGrade: string | null;
  thickness: string | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  finish: string | null;
  tolerance: string | null;
  weldingRequirements: string | null;
  surfaceTreatment: string | null;
  quantityNeeded: string;
  unitOfMeasure: string;
  submitByDate: string;
  additionalSpecifications: string | null;
  status: string;
};

type Supplier = {
  id: string;
  supplierName: string;
  email: string;
};

const quoteSchema = z.object({
  pricePerUnit: z.string().min(1, "Price is required"),
  leadTime: z.string().min(1, "Lead time is required"),
  paymentTerms: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteSubmission() {
  const [, params] = useRoute("/quote-submission/:id");
  const [location] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Extract token from URL query params
  const token = new URLSearchParams(window.location.search).get('token');
  const requestId = params?.id;

  const { data: quoteData, isLoading, error } = useQuery({
    queryKey: ['/api/public/quote-requests', requestId, token],
    queryFn: async () => {
      const url = `/api/public/quote-requests/${requestId}?token=${token}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text() || res.statusText);
      }
      return await res.json();
    },
    enabled: !!requestId && !!token,
  });

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      pricePerUnit: "",
      leadTime: "",
      paymentTerms: "",
      additionalNotes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const res = await apiRequest(`/api/public/quote-requests/${requestId}/submit-quote?token=${token}`, "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote submitted successfully",
        description: "Thank you for your submission. We will review it shortly.",
      });
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit quote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading quote request...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This quote request link is invalid or has expired. Please contact us if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { request, supplier } = quoteData as { request: QuoteRequest; supplier: Supplier };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl">Quote Submitted Successfully</CardTitle>
                  <CardDescription className="mt-2">
                    Thank you for submitting your quote for {request.requestNumber}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Your quote has been received and will be reviewed by our procurement team.
                  You will be contacted if your quote is selected.
                </AlertDescription>
              </Alert>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Material: <span className="font-medium text-foreground">{request.materialName}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Quantity: <span className="font-medium text-foreground">{request.quantityNeeded} {request.unitOfMeasure}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portal Account Prompt */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-xl">Want to Track All Your Quote Requests?</CardTitle>
              <CardDescription>
                Create a supplier account to access your personalized dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">View all your quote requests in one place</p>
                    <p className="text-sm text-muted-foreground">Track ongoing, submitted, and approved quotes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Manage quotes anytime, anywhere</p>
                    <p className="text-sm text-muted-foreground">Update your quotes and upload required documents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Get real-time status updates</p>
                    <p className="text-sm text-muted-foreground">See when your quotes are reviewed and approved</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.location.href = "/"}
                  data-testid="button-login-portal"
                >
                  Login to Supplier Portal
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Click "Login with Replit" on the next page to create your account
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-primary mb-1">Supplier Portal</div>
                <CardTitle className="text-3xl">Request for Quote</CardTitle>
                <CardDescription className="mt-2">
                  {request.requestNumber}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Submit by</div>
                <div className="font-semibold text-foreground">
                  {format(new Date(request.submitByDate), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Material Name</Label>
                <div className="font-medium text-foreground mt-1">{request.materialName}</div>
              </div>
              {request.materialType && (
                <div>
                  <Label className="text-muted-foreground">Material Type</Label>
                  <div className="font-medium text-foreground mt-1 capitalize">
                    {request.materialType.replace("_", " ")}
                  </div>
                </div>
              )}
              {request.materialGrade && (
                <div>
                  <Label className="text-muted-foreground">Material Grade</Label>
                  <div className="font-medium text-foreground mt-1">{request.materialGrade}</div>
                </div>
              )}
              {request.thickness && (
                <div>
                  <Label className="text-muted-foreground">Thickness</Label>
                  <div className="font-medium text-foreground mt-1">{request.thickness} mm</div>
                </div>
              )}
              {request.finish && (
                <div>
                  <Label className="text-muted-foreground">Finish</Label>
                  <div className="font-medium text-foreground mt-1 capitalize">
                    {request.finish.replace("_", " ")}
                  </div>
                </div>
              )}
              {request.dimensions && (request.dimensions.length || request.dimensions.width || request.dimensions.height) && (
                <div>
                  <Label className="text-muted-foreground">Dimensions</Label>
                  <div className="font-medium text-foreground mt-1">
                    {request.dimensions.length && `${request.dimensions.length}mm`}
                    {request.dimensions.width && ` × ${request.dimensions.width}mm`}
                    {request.dimensions.height && ` × ${request.dimensions.height}mm`}
                  </div>
                </div>
              )}
              {request.tolerance && (
                <div>
                  <Label className="text-muted-foreground">Tolerance</Label>
                  <div className="font-medium text-foreground mt-1">{request.tolerance}</div>
                </div>
              )}
              {request.weldingRequirements && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Welding Requirements</Label>
                  <div className="font-medium text-foreground mt-1">{request.weldingRequirements}</div>
                </div>
              )}
              {request.surfaceTreatment && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Surface Treatment</Label>
                  <div className="font-medium text-foreground mt-1">{request.surfaceTreatment}</div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Quantity Required</Label>
                <div className="font-medium text-foreground mt-1">
                  {request.quantityNeeded} {request.unitOfMeasure}
                </div>
              </div>
            </div>
            {request.additionalSpecifications && (
              <div className="pt-4 border-t border-border">
                <Label className="text-muted-foreground">Additional Specifications</Label>
                <div className="mt-2 text-foreground whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {request.additionalSpecifications}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Quote</CardTitle>
            <CardDescription>
              Submitting as: {supplier.supplierName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">
                    Price per {request.unitOfMeasure} (AUD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="input-price"
                    {...form.register("pricePerUnit")}
                  />
                  {form.formState.errors.pricePerUnit && (
                    <p className="text-sm text-destructive">{form.formState.errors.pricePerUnit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadTime">
                    Lead Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="leadTime"
                    placeholder="e.g., 2-3 weeks"
                    data-testid="input-lead-time"
                    {...form.register("leadTime")}
                  />
                  {form.formState.errors.leadTime && (
                    <p className="text-sm text-destructive">{form.formState.errors.leadTime.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentTerms">Payment Terms (Optional)</Label>
                  <Input
                    id="paymentTerms"
                    placeholder="e.g., Net 30"
                    data-testid="input-payment-terms"
                    {...form.register("paymentTerms")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional information about your quote..."
                  rows={4}
                  data-testid="textarea-notes"
                  {...form.register("additionalNotes")}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  * Required fields
                </p>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-quote"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Quote"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
