import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierQuoteSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, Package, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DocumentManager from "@/components/DocumentManager";

const quoteFormSchema = insertSupplierQuoteSchema.extend({
  requestId: z.string().min(1, "Request ID is required"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface QuoteRequestDetail {
  request: {
    id: string;
    requestNumber: string;
    materialName: string;
    casNumber?: string;
    femaNumber?: string;
    quantityNeeded: string;
    unitOfMeasure: string;
    submitByDate: string;
    additionalSpecifications?: string;
    status: string;
  };
  requestSupplier: {
    id: string;
    accessToken?: string;
    tokenExpiresAt?: string;
    emailSentAt?: string;
    responseSubmittedAt?: string;
  };
  quote?: {
    id: string;
    pricePerUnit: string;
    moq?: string;
    leadTime?: string;
    paymentTerms?: string;
    packSize?: string;
    shippingTerms?: string;
    freightCost?: string;
    shelfLife?: string;
    storageRequirements?: string;
    dangerousGoodsHandling?: string;
    additionalNotes?: string;
    preliminaryApprovalStatus: string;
    submittedAt: string;
  };
  supplier: {
    id: string;
    supplierName: string;
    email: string;
  };
}

export default function SupplierQuoteDetail() {
  const { requestId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: detail, isLoading } = useQuery<QuoteRequestDetail>({
    queryKey: [`/api/supplier/quote-requests/${requestId}`],
    enabled: !!requestId,
  });

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      requestId: requestId || '',
      pricePerUnit: 0,
      currency: 'AUD',
      moq: '',
      leadTime: '',
      paymentTerms: '',
      packSize: '',
      shippingTerms: '',
      freightCost: undefined,
      shelfLife: '',
      storageRequirements: '',
      dangerousGoodsHandling: '',
      additionalNotes: '',
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (detail?.quote) {
      form.reset({
        requestId: requestId || '',
        pricePerUnit: Number(detail.quote.pricePerUnit),
        currency: 'AUD',
        moq: detail.quote.moq ?? '',
        leadTime: detail.quote.leadTime ?? '',
        paymentTerms: detail.quote.paymentTerms ?? '',
        packSize: detail.quote.packSize ?? '',
        shippingTerms: detail.quote.shippingTerms ?? '',
        freightCost: detail.quote.freightCost ? Number(detail.quote.freightCost) : undefined,
        shelfLife: detail.quote.shelfLife ?? '',
        storageRequirements: detail.quote.storageRequirements ?? '',
        dangerousGoodsHandling: detail.quote.dangerousGoodsHandling ?? '',
        additionalNotes: detail.quote.additionalNotes ?? '',
      });
    }
  }, [detail?.quote, requestId, form]);

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      return await apiRequest('/api/supplier/quotes', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/quote-requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/supplier/quote-requests/${requestId}`] });
      toast({
        title: "Quote submitted successfully",
        description: "Your quote has been submitted for review",
      });
      navigate('/supplier/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit quote",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormValues) => {
    console.log('=== FORM SUBMISSION ===');
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    submitQuoteMutation.mutate(data);
  };

  // Log validation errors
  const onError = (errors: any) => {
    console.error('=== FORM VALIDATION ERRORS ===');
    console.error('Errors:', errors);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading quote request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg font-semibold">Quote request not found</p>
              <Button className="mt-4" onClick={() => navigate('/supplier/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { request, quote, supplier } = detail;
  const isExpired = new Date(request.submitByDate) < new Date();
  const hasQuote = !!quote;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium text-foreground" data-testid="text-page-title">
              Quote Request Details
            </h1>
            <p className="text-muted-foreground mt-1">
              RFQ: {request.requestNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasQuote && quote && (
              <Badge 
                variant={
                  quote.preliminaryApprovalStatus === 'approved' ? 'default' :
                  quote.preliminaryApprovalStatus === 'rejected' ? 'destructive' :
                  'secondary'
                }
                data-testid="badge-approval-status"
              >
                {quote.preliminaryApprovalStatus}
              </Badge>
            )}
            {isExpired && !hasQuote && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
        </div>

        {/* Material Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Material Name</div>
              <div className="font-semibold" data-testid="text-material-name">
                {request.materialName}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Quantity Needed</div>
              <div className="font-semibold">
                {request.quantityNeeded} {request.unitOfMeasure}
              </div>
            </div>
            {request.casNumber && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">CAS Number</div>
                <div className="font-semibold">{request.casNumber}</div>
              </div>
            )}
            {request.femaNumber && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">FEMA Number</div>
                <div className="font-semibold">{request.femaNumber}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Submit By</div>
              <div className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(request.submitByDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </CardContent>
          {request.additionalSpecifications && (
            <>
              <CardHeader className="pt-0">
                <CardTitle className="text-base">Additional Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.additionalSpecifications}
                </p>
              </CardContent>
            </>
          )}
        </Card>

        {/* Quote Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {hasQuote ? 'Update Your Quote' : 'Submit Your Quote'}
            </CardTitle>
            {hasQuote && quote && (
              <CardDescription>
                Quote submitted on {format(new Date(quote.submittedAt), 'MMM dd, yyyy')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                {/* Pricing Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Pricing & Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Unit (AUD) *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0.00" 
                              type="number" 
                              step="0.01"
                              data-testid="input-price-per-unit"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="packSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pack Size</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 25kg bags, 200L drums" 
                              data-testid="input-pack-size"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="moq"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Order Quantity (MOQ)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 100 units" 
                              data-testid="input-moq"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Net 30, COD" 
                              data-testid="input-payment-terms"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Shipping & Logistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Shipping & Logistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="leadTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Time to Melbourne, Australia</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 4-6 weeks" 
                              data-testid="input-lead-time"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="freightCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freight Cost (AUD)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0.00" 
                              type="number" 
                              step="0.01"
                              data-testid="input-freight-cost"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="shippingTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., FOB, CIF, delivery conditions, insurance" 
                            rows={3}
                            data-testid="textarea-shipping-terms"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shelfLife"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Shelf Life</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 24 months from manufacturing" 
                              data-testid="input-shelf-life"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="storageRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Requirements</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Cool, dry place, 15-25°C" 
                              data-testid="input-storage-requirements"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dangerousGoodsHandling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dangerous Goods Handling Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Specify any dangerous goods classification, handling requirements, or special precautions" 
                            rows={3}
                            data-testid="textarea-dangerous-goods"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information or notes" 
                          rows={4}
                          data-testid="textarea-additional-notes"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/supplier/dashboard')}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitQuoteMutation.isPending || isExpired}
                    data-testid="button-submit-quote"
                  >
                    {submitQuoteMutation.isPending ? 'Submitting...' : hasQuote ? 'Update Quote' : 'Submit Quote'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Document Upload Section (if approved) */}
        {hasQuote && quote && quote.preliminaryApprovalStatus === 'approved' && (
          <div>
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Quote Approved - Action Required
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your quote has been preliminarily approved. Please upload any requested documents below.
                  </p>
                </div>
              </div>
            </div>
            <DocumentManager
              quoteId={quote.id}
              canUpload={true}
              canDelete={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
