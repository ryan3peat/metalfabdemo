import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Clock, CheckCircle2, AlertCircle, Package, Calendar, FileText, Upload } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface DashboardStats {
  totalRequests: number;
  ongoing: number;
  pendingDocumentation: number;  // Renamed from 'approved' - quotes awaiting doc upload
  expired: number;
  finalSubmitted: number;
  initialSubmitted: number;
  quotesSubmitted: number;
}

interface QuoteRequest {
  id: string;
  requestNumber: string;
  materialName: string;
  quantityNeeded: string;
  unitOfMeasure: string;
  submitByDate: string;
  status: string;
  hasQuote: boolean;
  isExpired: boolean;
  quote?: {
    id: string;
    pricePerUnit: string;
    preliminaryApprovalStatus: string;
    submittedAt: string;
    documentsRequested?: number;
    documentsUploaded?: number;
  };
}

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ongoing");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/supplier/dashboard'],
  });

  const { data: quoteRequests, isLoading: requestsLoading } = useQuery<QuoteRequest[]>({
    queryKey: ['/api/supplier/quote-requests'],
  });

  // Categorize requests
  const ongoingRequests = quoteRequests?.filter(qr => !qr.hasQuote && !qr.isExpired) || [];
  const initialSubmittedRequests = quoteRequests?.filter(qr =>
    qr.hasQuote && qr.quote?.preliminaryApprovalStatus === 'initial_submitted'
  ) || [];
  const expiredRequests = quoteRequests?.filter(qr => !qr.hasQuote && qr.isExpired) || [];
  const pendingDocumentationRequests = quoteRequests?.filter(qr =>
    qr.hasQuote && qr.quote?.preliminaryApprovalStatus === 'pending_documentation'
  ) || [];
  const finalSubmittedRequests = quoteRequests?.filter(qr =>
    qr.hasQuote && qr.quote?.preliminaryApprovalStatus === 'final_submitted'
  ) || [];

  const QuoteRequestCard = ({ request }: { request: QuoteRequest }) => (
    <Card className="hover-elevate" data-testid={`card-quote-request-${request.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base font-semibold truncate">
                {request.materialName}
              </CardTitle>
              {request.hasQuote && request.quote && (
                <Badge
                  variant={
                    request.quote.preliminaryApprovalStatus === 'pending_documentation' ? 'default' :
                    request.quote.preliminaryApprovalStatus === 'final_submitted' ? 'default' :
                    request.quote.preliminaryApprovalStatus === 'rejected' ? 'destructive' :
                    'secondary'
                  }
                  data-testid={`badge-approval-${request.id}`}
                >
                  {request.quote.preliminaryApprovalStatus === 'pending_documentation' ? 'Pending Documentation' :
                   request.quote.preliminaryApprovalStatus === 'initial_submitted' ? 'Initial Submitted' :
                   request.quote.preliminaryApprovalStatus === 'final_submitted' ? 'Final Submitted' :
                   request.quote.preliminaryApprovalStatus}
                </Badge>
              )}
              {request.isExpired && !request.hasQuote && (
                <Badge variant="destructive" data-testid={`badge-expired-${request.id}`}>
                  Expired
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              RFQ: {request.requestNumber}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {request.quantityNeeded} {request.unitOfMeasure}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Due: {format(new Date(request.submitByDate), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        {request.hasQuote && request.quote && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Quote:</span>
              <span className="font-semibold text-foreground">
                ${parseFloat(request.quote.pricePerUnit).toFixed(2)} / unit
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Submitted: {format(new Date(request.quote.submittedAt), 'MMM dd, yyyy')}
            </div>
          </div>
        )}
        {request.hasQuote && (request.quote?.preliminaryApprovalStatus === 'pending_documentation' || request.quote?.preliminaryApprovalStatus === 'final_submitted') && (
          <div className="pt-2 border-t space-y-2">
            {request.quote.documentsRequested !== undefined && request.quote.documentsRequested > 0 ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Documents:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {request.quote.documentsUploaded || 0}/{request.quote.documentsRequested}
                    </span>
                    {(request.quote.documentsUploaded || 0) < request.quote.documentsRequested && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Upload className="h-3 w-3 mr-1" />
                        Action Needed
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>No documents requested</span>
              </div>
            )}
          </div>
        )}
        <Link href={`/supplier/quote-requests/${request.id}`}>
          <Button 
            className="w-full" 
            variant={request.hasQuote ? "outline" : "default"}
            data-testid={`button-view-request-${request.id}`}
          >
            {request.hasQuote && request.quote?.preliminaryApprovalStatus === 'pending_documentation' &&
             request.quote.documentsRequested && request.quote.documentsRequested > 0 &&
             (request.quote.documentsUploaded || 0) < request.quote.documentsRequested
              ? 'Upload Documents'
              : request.hasQuote
              ? 'View Quote'
              : 'Submit Quote'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  if (statsLoading || requestsLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground" data-testid="text-dashboard-title">
            Supplier Portal
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2" data-testid="text-welcome-message">
            Welcome back! Here's an overview of your quote requests.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card 
            className="hover-elevate cursor-pointer transition-all" 
            onClick={() => setActiveTab("ongoing")}
            data-testid="card-stat-ongoing"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ongoing Requests
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="stat-ongoing">
                {stats?.ongoing || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your quote
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer transition-all" 
            onClick={() => setActiveTab("pending-docs")}
            data-testid="card-stat-pending-docs"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pending Docs
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Upload className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="stat-pending-documentation">
                {stats?.pendingDocumentation || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Documents required
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer transition-all" 
            onClick={() => setActiveTab("final-submitted")}
            data-testid="card-stat-final-submitted"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Final Submitted
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="stat-final-submitted">
                {stats?.finalSubmitted || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete submissions
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer transition-all" 
            onClick={() => setActiveTab("expired")}
            data-testid="card-stat-expired"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Expired
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="stat-expired">
                {stats?.expired || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Past deadline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quote Requests Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Your Quote Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ongoing" data-testid="tab-ongoing">
                  Ongoing ({ongoingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="pending-docs" data-testid="tab-pending-docs">
                  Pending Docs ({pendingDocumentationRequests.length})
                </TabsTrigger>
                <TabsTrigger value="final-submitted" data-testid="tab-final-submitted">
                  Final Submitted ({finalSubmittedRequests.length})
                </TabsTrigger>
                <TabsTrigger value="expired" data-testid="tab-expired">
                  Expired ({expiredRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing" className="space-y-4">
                {ongoingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No ongoing quote requests</p>
                    <p className="text-sm mt-2">New requests will appear here when sent</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ongoingRequests.map(request => (
                      <QuoteRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending-docs" className="space-y-4">
                {pendingDocumentationRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending documentation</p>
                    <p className="text-sm mt-2">Quotes requiring document uploads will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingDocumentationRequests.map(request => (
                      <QuoteRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="final-submitted" className="space-y-4">
                {finalSubmittedRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No final submissions yet</p>
                    <p className="text-sm mt-2">Quotes with all documentation complete will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {finalSubmittedRequests.map(request => (
                      <QuoteRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired" className="space-y-4">
                {expiredRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No expired requests</p>
                    <p className="text-sm mt-2">Requests past their deadline will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiredRequests.map(request => (
                      <QuoteRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
