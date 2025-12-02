import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Calendar, DollarSign, TrendingDown, Trash2, Clock, Mail, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface QuoteRequestDetails {
  request: {
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
    status: 'draft' | 'active' | 'closed' | 'cancelled';
    createdAt: string;
  };
  suppliers: Array<{
    id: string;
    supplierName: string;
    email: string;
    requestSupplierId: string;
    emailSentAt: string | null;
    quote: {
      id: string;
      pricePerUnit: string;
      leadTime: string;
      moq: string | null;
      paymentTerms: string | null;
      additionalNotes: string | null;
      currency: string;
      submittedAt: string;
    } | null;
  }>;
}

const statusColors = {
  draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function QuoteRequestDetail() {
  const [, params] = useRoute("/quote-requests/:id");
  const [, setLocation] = useLocation();
  const requestId = params?.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resendingSupplierId, setResendingSupplierId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<QuoteRequestDetails>({
    queryKey: ['/api/quote-requests', requestId],
    enabled: !!requestId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete quote request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Deleted",
        description: "The quote request has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quote-requests'] });
      setLocation('/quote-requests');
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendNotificationMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      setResendingSupplierId(supplierId);
      const response = await apiRequest(
        `/api/quote-requests/${requestId}/resend-notification/${supplierId}`,
        'POST'
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Quote request reminder has been sent to the supplier.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quote-requests', requestId] });
      setResendingSupplierId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Reminder",
        description: error.message,
        variant: "destructive",
      });
      setResendingSupplierId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground mt-4">Loading quote request details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">Quote Request Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The quote request you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/quote-requests">
              <Button variant="outline" data-testid="button-back-to-list">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quote Requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { request, suppliers } = data;
  const quotesReceived = suppliers.filter(s => s.quote !== null).length;
  const totalSuppliers = suppliers.length;

  const sortedQuotes = suppliers
    .filter(s => s.quote !== null)
    .sort((a, b) => parseFloat(a.quote!.pricePerUnit) - parseFloat(b.quote!.pricePerUnit));

  const bestQuoteSupplier = sortedQuotes.length > 0 ? sortedQuotes[0] : null;
  const bestQuote = bestQuoteSupplier 
    ? {
        price: parseFloat(bestQuoteSupplier.quote!.pricePerUnit),
        currency: bestQuoteSupplier.quote!.currency || 'AUD'
      }
    : null;

  const pendingSuppliers = suppliers.filter(s => s.quote === null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quote-requests">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-rfq-number">
              {request.requestNumber} • {request.materialName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and compare supplier quotes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`${statusColors[request.status]} uppercase text-xs font-semibold`}
            data-testid="badge-status"
          >
            {request.status}
          </Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            data-testid="button-delete-request"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Request
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes Received</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-quotes-count">
              {quotesReceived} / {totalSuppliers}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliers - quotesReceived} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submit By</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(request.submitByDate), "MMM d")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(request.submitByDate), "yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Quote</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-best-quote">
              {bestQuote
                ? `${bestQuote.price.toFixed(2)} ${bestQuote.currency}`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {bestQuote ? "Lowest price per unit" : "No quotes yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Supplier Quotes Comparison</CardTitle>
              <CardDescription>
                {quotesReceived} quote{quotesReceived !== 1 ? 's' : ''} received, {pendingSuppliers.length} pending
              </CardDescription>
            </div>
            {sortedQuotes.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span>Best to highest</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedQuotes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Quotes Received ({sortedQuotes.length})
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                {sortedQuotes.map((supplier, index) => (
                  <Card 
                    key={supplier.id}
                    className={index === 0 ? "border-primary/50 bg-primary/5" : ""}
                    data-testid={`card-supplier-${index + 1}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-1">
                        <CardTitle className="text-base">
                          #{index + 1}
                        </CardTitle>
                        {index === 0 && (
                          <Badge 
                            variant="outline" 
                            className="bg-primary/10 text-primary border-primary/20 text-xs"
                            data-testid="badge-best-price"
                          >
                            Best Price
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="font-medium text-foreground">
                        {supplier.supplierName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Price per Unit</p>
                        <p className="text-2xl font-bold text-foreground" data-testid={`text-price-${index + 1}`}>
                          {supplier.quote!.currency} {parseFloat(supplier.quote!.pricePerUnit).toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Date Requested</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1" data-testid={`text-date-requested-${index + 1}`}>
                            <Mail className="h-3 w-3" />
                            {supplier.emailSentAt 
                              ? format(new Date(supplier.emailSentAt), "MMM d, yyyy")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">MOQ</p>
                          <p className="text-sm font-medium text-foreground" data-testid={`text-moq-${index + 1}`}>
                            {supplier.quote!.moq || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Lead Time</p>
                          <p className="text-sm font-medium text-foreground" data-testid={`text-lead-time-${index + 1}`}>
                            {supplier.quote!.leadTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Payment Terms</p>
                          <p className="text-sm font-medium text-foreground" data-testid={`text-payment-terms-${index + 1}`}>
                            {supplier.quote!.paymentTerms || "—"}
                          </p>
                        </div>
                      </div>
                      <Link href={`/quote-requests/${request.id}/quotes/${supplier.quote!.id}`}>
                        <Button
                          variant={index === 0 ? "default" : "outline"}
                          className="w-full"
                          data-testid={`button-select-${index + 1}`}
                        >
                          Select Quote
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingSuppliers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Awaiting Quote ({pendingSuppliers.length})
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                {pendingSuppliers.map((supplier) => (
                  <Card 
                    key={supplier.id}
                    className="border-dashed"
                    data-testid={`card-pending-supplier-${supplier.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-1">
                        <CardTitle className="text-base text-muted-foreground">
                          Pending
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
                        >
                          Awaiting Quote
                        </Badge>
                      </div>
                      <CardDescription className="font-medium text-foreground">
                        {supplier.supplierName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Date Requested</p>
                        <p className="text-sm font-medium text-foreground flex items-center gap-1" data-testid={`text-date-requested-pending-${supplier.id}`}>
                          <Mail className="h-3 w-3" />
                          {supplier.emailSentAt 
                            ? format(new Date(supplier.emailSentAt), "MMM d, yyyy")
                            : "Not sent"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {supplier.email}
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => resendNotificationMutation.mutate(supplier.id)}
                          disabled={resendingSupplierId === supplier.id}
                          data-testid={`button-resend-${supplier.id}`}
                        >
                          {resendingSupplierId === supplier.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Request Quotation Again
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {suppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Suppliers Invited</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No suppliers have been invited to this quote request yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
          <CardDescription>Quote request specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Material Name</p>
              <p className="text-base font-medium" data-testid="text-material-name">
                {request.materialName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity Needed</p>
              <p className="text-base font-medium">
                {request.quantityNeeded} {request.unitOfMeasure}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Material Type</p>
              <p className="text-base font-medium capitalize">
                {request.materialType ? request.materialType.replace("_", " ") : "—"}
              </p>
            </div>
            {request.materialGrade && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Grade</p>
                <p className="text-base font-medium">{request.materialGrade}</p>
              </div>
            )}
            {request.thickness && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thickness</p>
                <p className="text-base font-medium">{request.thickness} mm</p>
              </div>
            )}
            {request.finish && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Finish</p>
                <p className="text-base font-medium capitalize">
                  {request.finish.replace("_", " ")}
                </p>
              </div>
            )}
            {request.dimensions && (request.dimensions.length || request.dimensions.width || request.dimensions.height) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dimensions</p>
                <p className="text-base font-medium">
                  {request.dimensions.length && `${request.dimensions.length}mm`}
                  {request.dimensions.width && ` × ${request.dimensions.width}mm`}
                  {request.dimensions.height && ` × ${request.dimensions.height}mm`}
                </p>
              </div>
            )}
            {request.tolerance && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tolerance</p>
                <p className="text-base font-medium">{request.tolerance}</p>
              </div>
            )}
            {request.weldingRequirements && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Welding Requirements</p>
                <p className="text-base font-medium">{request.weldingRequirements}</p>
              </div>
            )}
            {request.surfaceTreatment && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Surface Treatment</p>
                <p className="text-base font-medium">{request.surfaceTreatment}</p>
              </div>
            )}
          </div>
          {request.additionalSpecifications && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Additional Specifications</p>
              <p className="text-base">{request.additionalSpecifications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote request? This action cannot be undone.
              All supplier quotes and associated documents will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
