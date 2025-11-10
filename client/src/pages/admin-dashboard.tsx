import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Users, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { QuoteRequest } from "@shared/schema";

interface DashboardStats {
  activeRequests: number;
  totalSuppliers: number;
  pendingQuotes: number;
  averageResponseTimeHours: number | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
  });

  const { data: recentRequests, isLoading: requestsLoading } = useQuery<QuoteRequest[]>({
    queryKey: ['/api/quote-requests'],
    select: (data) => data.slice(0, 5),
  });

  const formatResponseTime = (hours: number | null) => {
    if (hours === null || hours === undefined) return '--';
    
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-medium text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.firstName || 'Admin'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Active Requests
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-1/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-active-requests" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground" data-testid="text-active-requests">
                    {stats?.activeRequests ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activeRequests === 0 ? 'No active quote requests' : 'Active quote requests'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Total Suppliers
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-total-suppliers" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground" data-testid="text-total-suppliers">
                    {stats?.totalSuppliers ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalSuppliers === 0 ? 'Ready to add suppliers' : 'Suppliers in directory'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pending Quotes
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-pending-quotes" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground" data-testid="text-pending-quotes">
                    {stats?.pendingQuotes ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingQuotes === 0 ? 'Awaiting submissions' : 'Quotes awaiting review'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Avg Response Time
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-avg-response-time" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground" data-testid="text-avg-response-time">
                    {formatResponseTime(stats?.averageResponseTimeHours ?? null)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.averageResponseTimeHours != null ? 'Average supplier response' : 'No data yet'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Quote Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-recent-requests" />
                </div>
              ) : recentRequests && recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.map((request) => (
                    <Link 
                      key={request.id} 
                      href={`/quote-requests/${request.id}`}
                      data-testid={`link-request-${request.id}`}
                    >
                      <div className="p-3 border border-border rounded-md hover-elevate cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate" data-testid={`text-request-number-${request.id}`}>
                              {request.requestNumber}
                            </div>
                            <div className="text-sm text-muted-foreground truncate" data-testid={`text-material-name-${request.id}`}>
                              {request.materialName}
                            </div>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                request.status === 'active' 
                                  ? 'bg-chart-1/10 text-chart-1' 
                                  : request.status === 'draft'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                              data-testid={`text-status-${request.id}`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quote requests yet</p>
                  <p className="text-sm mt-2">Create your first RFQ to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/quote-requests/create">
                  <div 
                    className="p-4 border border-border rounded-md hover-elevate cursor-pointer" 
                    data-testid="button-quick-create-quote"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Create Quote Request</div>
                        <div className="text-sm text-muted-foreground">Start new RFQ workflow</div>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/suppliers">
                  <div 
                    className="p-4 border border-border rounded-md hover-elevate cursor-pointer" 
                    data-testid="button-quick-manage-suppliers"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Manage Suppliers</div>
                        <div className="text-sm text-muted-foreground">View and edit supplier directory</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
