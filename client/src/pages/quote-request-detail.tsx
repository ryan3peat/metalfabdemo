import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

type QuoteRequest = {
  id: number;
  requestNumber: string;
  materialName: string;
  casNumber: string | null;
  femaNumber: string | null;
  materialCategory: string | null;
  materialForm: string | null;
  materialGrade: string | null;
  materialOrigin: string | null;
  quantityNeeded: string;
  unitOfMeasure: string;
  submitByDate: string;
  additionalSpecifications: string | null;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  createdAt: string;
  createdBy: number;
  findNewSuppliers: boolean;
};

export default function QuoteRequestDetail() {
  const [, params] = useRoute("/quote-requests/:id");
  const requestId = params?.id;

  const { data: request, isLoading } = useQuery<QuoteRequest>({
    queryKey: ['/api/quote-requests', requestId],
    enabled: !!requestId,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Quote request not found</p>
            <Link href="/quote-requests">
              <Button variant="outline" className="mt-4">
                Back to Quote Requests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quote-requests">
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-medium text-foreground">
                {request.requestNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                Created {format(new Date(request.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <Badge className={statusColors[request.status]} data-testid="status-badge">
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Material Name</div>
                <div className="text-foreground font-medium" data-testid="detail-material-name">
                  {request.materialName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">CAS Number</div>
                  <div className="text-foreground" data-testid="detail-cas-number">
                    {request.casNumber || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">FEMA Number</div>
                  <div className="text-foreground" data-testid="detail-fema-number">
                    {request.femaNumber || '—'}
                  </div>
                </div>
              </div>

              {request.materialCategory && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
                  <Badge variant="outline" data-testid="detail-category">
                    {request.materialCategory.replace('_', ' ').charAt(0).toUpperCase() + 
                     request.materialCategory.replace('_', ' ').slice(1)}
                  </Badge>
                </div>
              )}

              {request.materialForm && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Form</div>
                  <Badge variant="outline" data-testid="detail-form">
                    {request.materialForm.charAt(0).toUpperCase() + request.materialForm.slice(1)}
                  </Badge>
                </div>
              )}

              {request.materialGrade && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Grade</div>
                  <div className="text-foreground" data-testid="detail-grade">
                    {request.materialGrade}
                  </div>
                </div>
              )}

              {request.materialOrigin && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Origin</div>
                  <div className="text-foreground" data-testid="detail-origin">
                    {request.materialOrigin}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Quantity Needed</div>
                <div className="text-foreground font-medium" data-testid="detail-quantity">
                  {request.quantityNeeded} {request.unitOfMeasure}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Submit By Date</div>
                <div className="text-foreground" data-testid="detail-submit-by">
                  {format(new Date(request.submitByDate), "MMMM d, yyyy")}
                </div>
              </div>

              {request.additionalSpecifications && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Additional Specifications</div>
                  <div className="text-foreground whitespace-pre-wrap" data-testid="detail-specifications">
                    {request.additionalSpecifications}
                  </div>
                </div>
              )}

              {request.findNewSuppliers && (
                <div className="pt-2 border-t border-border">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                    Finding new suppliers
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Supplier information will be displayed here</p>
              <p className="text-sm mt-2">This feature is coming in Module 6</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
