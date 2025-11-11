import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  Package,
  Truck,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import DocumentManager from "@/components/DocumentManager";

interface QuoteDetails {
  quote: {
    id: string;
    pricePerUnit: string;
    currency: string;
    moq: string | null;
    leadTime: string;
    validityDate: string | null;
    paymentTerms: string | null;
    additionalNotes: string | null;
    packSize: string | null;
    shippingTerms: string | null;
    freightCost: string | null;
    shelfLife: string | null;
    storageRequirements: string | null;
    dangerousGoodsHandling: string | null;
    preliminaryApprovalStatus: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  };
  supplier: {
    id: string;
    supplierName: string;
    contactPerson: string;
    email: string;
    phone: string | null;
    location: string | null;
  };
  request: {
    id: string;
    requestNumber: string;
    materialName: string;
    casNumber: string | null;
    femaNumber: string | null;
    quantityNeeded: string;
    unitOfMeasure: string;
  };
}

const approvalStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const DOCUMENT_TYPES = [
  { value: "coa", label: "Certificate of Analysis (COA)" },
  { value: "pif", label: "PIF" },
  { value: "specification", label: "Specification" },
  { value: "sds", label: "SDS" },
  { value: "halal", label: "Halal - Certificate or compliance statement" },
  { value: "kosher", label: "Kosher - Certificate or compliance statement" },
  { value: "natural_status", label: "Natural status - Artificial, Nature Identical or Natural" },
  { value: "process_flow", label: "Process Flow" },
  { value: "gfsi_cert", label: "Supplier GFSI Cert - e.g. SQF, FSSC 22000 etc." },
  { value: "organic", label: "Organic - Certificate or compliance statement – if applicable" },
];

export default function QuoteDetail() {
  const [, params] = useRoute("/quote-requests/:requestId/quotes/:quoteId");
  const { requestId, quoteId } = params || {};
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<QuoteDetails>({
    queryKey: ['/api/quotes', quoteId],
    enabled: !!quoteId,
  });

  const requestDocumentsMutation = useMutation({
    mutationFn: async (documents: string[]) => {
      const response = await fetch(`/api/quotes/${quoteId}/request-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestedDocuments: documents }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request documents');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documents Requested",
        description: "The supplier has been notified to upload the requested documents.",
      });
      setDialogOpen(false);
      setSelectedDocuments([]);
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDocumentToggle = (documentType: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentType)
        ? prev.filter(d => d !== documentType)
        : [...prev, documentType]
    );
  };

  const handleRequestDocuments = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "No Documents Selected",
        description: "Please select at least one document to request.",
        variant: "destructive",
      });
      return;
    }
    requestDocumentsMutation.mutate(selectedDocuments);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground mt-4">Loading quote details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">Quote Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The quote you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href={`/quote-requests/${requestId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quote Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { quote, supplier, request } = data;
  const totalPrice = parseFloat(quote.pricePerUnit) * parseFloat(request.quantityNeeded);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/quote-requests/${requestId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quote Request
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Quote Details
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {request.requestNumber} • {supplier.supplierName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${approvalStatusColors[quote.preliminaryApprovalStatus]} uppercase text-xs font-semibold`}
          >
            {quote.preliminaryApprovalStatus}
          </Badge>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileCheck className="h-4 w-4 mr-2" />
                Request for Further Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Documents from Supplier</DialogTitle>
                <DialogDescription>
                  Select the documents you need {supplier.supplierName} to provide for {request.materialName}.
                  The supplier will receive an email notification with the list of requested documents.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {DOCUMENT_TYPES.map((doc) => (
                  <div key={doc.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={doc.value}
                      checked={selectedDocuments.includes(doc.value)}
                      onCheckedChange={() => handleDocumentToggle(doc.value)}
                    />
                    <Label
                      htmlFor={doc.value}
                      className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                      {doc.label}
                    </Label>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedDocuments([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestDocuments}
                  disabled={requestDocumentsMutation.isPending || selectedDocuments.length === 0}
                >
                  {requestDocumentsMutation.isPending ? "Sending..." : `Request ${selectedDocuments.length} Document${selectedDocuments.length !== 1 ? 's' : ''}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price per Unit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.currency} {parseFloat(quote.pricePerUnit).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per {request.unitOfMeasure}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estimate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.currency} {totalPrice.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              For {request.quantityNeeded} {request.unitOfMeasure}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.leadTime}
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery timeframe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Until</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.validityDate ? format(new Date(quote.validityDate), "MMM d") : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {quote.validityDate ? format(new Date(quote.validityDate), "yyyy") : "Not specified"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Supplier Information</CardTitle>
          </div>
          <CardDescription>Contact details and business information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company Name</p>
              <p className="text-base font-medium">{supplier.supplierName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
              <p className="text-base font-medium">{supplier.contactPerson}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base font-medium">{supplier.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-base font-medium">{supplier.phone || "—"}</p>
            </div>
            {supplier.location && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-base font-medium">{supplier.location}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Material & Quote Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Material Details</CardTitle>
            </div>
            <CardDescription>Quote request specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Material Name</p>
              <p className="text-base font-medium">{request.materialName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity Required</p>
              <p className="text-base font-medium">{request.quantityNeeded} {request.unitOfMeasure}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CAS Number</p>
                <p className="text-base font-medium">{request.casNumber || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">FEMA Number</p>
                <p className="text-base font-medium">{request.femaNumber || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Commercial Terms</CardTitle>
            </div>
            <CardDescription>Pricing and order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Minimum Order Quantity (MOQ)</p>
              <p className="text-base font-medium">{quote.moq || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pack Size</p>
              <p className="text-base font-medium">{quote.packSize || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
              <p className="text-base font-medium">{quote.paymentTerms || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping & Logistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Shipping & Logistics</CardTitle>
          </div>
          <CardDescription>Delivery and storage information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shipping Terms</p>
              <p className="text-base font-medium">{quote.shippingTerms || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Freight Cost</p>
              <p className="text-base font-medium">
                {quote.freightCost ? `${quote.currency} ${parseFloat(quote.freightCost).toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shelf Life</p>
              <p className="text-base font-medium">{quote.shelfLife || "—"}</p>
            </div>
          </div>
          {quote.storageRequirements && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Storage Requirements</p>
              <p className="text-base">{quote.storageRequirements}</p>
            </div>
          )}
          {quote.dangerousGoodsHandling && (
            <div className="mt-4">
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Dangerous Goods Handling
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {quote.dangerousGoodsHandling}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      {quote.additionalNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Supplier provided information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{quote.additionalNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      <DocumentManager
        quoteId={quote.id}
        canUpload={false}
        canDelete={false}
      />

      {/* Quote Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>
              Submitted on {format(new Date(quote.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
