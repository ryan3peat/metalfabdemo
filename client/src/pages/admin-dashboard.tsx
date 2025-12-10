import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Users, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { QuoteRequest } from "@shared/schema";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  activeRequests: number;
  totalSuppliers: number;
  pendingQuotes: number;
  averageResponseTimeHours: number | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
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
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-foreground">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Welcome back, {user?.firstName || 'Admin'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              href: "/quote-requests",
              title: "Active Requests",
              icon: FileText,
              iconColor: "chart-1",
              value: stats?.activeRequests ?? 0,
              loading: statsLoading,
              testId: "active-requests",
              description: (val: number) => val === 0 ? 'No active quote requests' : 'Click to view all requests',
            },
            {
              href: "/suppliers",
              title: "Total Suppliers",
              icon: Users,
              iconColor: "chart-2",
              value: stats?.totalSuppliers ?? 0,
              loading: statsLoading,
              testId: "total-suppliers",
              description: (val: number) => val === 0 ? 'Ready to add suppliers' : 'Click to manage suppliers',
            },
            {
              href: "/quote-requests?filter=pending-docs",
              title: "Pending Docs",
              icon: Clock,
              iconColor: "chart-3",
              value: stats?.pendingQuotes ?? 0,
              loading: statsLoading,
              testId: "pending-docs",
              description: (val: number) => val === 0 ? 'No pending documentation' : 'Click to view requests',
            },
            {
              href: null,
              title: "Avg Response Time",
              icon: TrendingUp,
              iconColor: "chart-4",
              value: formatResponseTime(stats?.averageResponseTimeHours ?? null),
              loading: statsLoading,
              testId: "avg-response-time",
              description: () => stats?.averageResponseTimeHours != null ? 'Average supplier response' : 'No data yet',
              isString: true,
            },
          ].map((stat, index) => {
            const CardWrapper = stat.href ? Link : motion.div;
            const cardProps = stat.href ? { href: stat.href } : {};
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CardWrapper {...cardProps}>
                  <Card className="glass-card hover-elevate cursor-pointer transition-all border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <motion.div
                        className={`h-8 w-8 rounded-full bg-${stat.iconColor}/10 flex items-center justify-center`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className={`h-4 w-4 text-${stat.iconColor}`} />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      {stat.loading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-9 w-20" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-foreground" data-testid={`text-${stat.testId}`}>
                            {stat.isString ? (
                              stat.value
                            ) : (
                              <AnimatedCounter value={stat.value as number} />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stat.description(stat.value as number)}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
