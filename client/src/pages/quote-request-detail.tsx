import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Calendar, DollarSign, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface QuoteRequestDetails {
  request: {
    id: string;
    requestNumber: string;
    materialName: string;
    casNumber: string | null;
    femaNumber: string | null;
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
  const requestId = params?.id;

  const { data, isLoading } = useQuery<QuoteRequestDetails>({
    queryKey: ['/api/quote-requests', requestId],
    enabled: !!requestId,
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

  const bestQuote = quotesReceived > 0
    ? suppliers
        .filter(s => s.quote)
        .reduce((min, s) => {
          const price = parseFloat(s.quote!.pricePerUnit);
          return price < min ? price : min;
        }, Infinity)
    : null;

  const sortedQuotes = suppliers
    .filter(s => s.quote !== null)
    .sort((a, b) => parseFloat(a.quote!.pricePerUnit) - parseFloat(b.quote!.pricePerUnit))
    .slice(0, 3);

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
              {request.requestNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and compare supplier quotes
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${statusColors[request.status]} uppercase text-xs font-semibold`}
          data-testid="badge-status"
        >
          {request.status}
        </Badge>
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
                ? `${bestQuote.toFixed(2)} ${suppliers.find(s => s.quote)?.quote?.currency || 'AUD'}`
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
              <p className="text-sm font-medium text-muted-foreground">CAS Number</p>
              <p className="text-base font-medium">{request.casNumber || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">FEMA Number</p>
              <p className="text-base font-medium">{request.femaNumber || "—"}</p>
            </div>
          </div>
          {request.additionalSpecifications && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Additional Specifications</p>
              <p className="text-base">{request.additionalSpecifications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Quotes Comparison</CardTitle>
              <CardDescription>
                Top {sortedQuotes.length} quote{sortedQuotes.length !== 1 ? 's' : ''} ordered by best price
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
        <CardContent>
          {sortedQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Quotes Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Waiting for suppliers to submit their quotes. You'll see the top 3 quotes here once received.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {sortedQuotes.map((supplier, index) => (
                <Card 
                  key={supplier.id}
                  className={index === 0 ? "border-primary/50 bg-primary/5" : ""}
                  data-testid={`card-supplier-${index + 1}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-1">
                      <CardTitle className="text-base">
                        Supplier #{index + 1}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
