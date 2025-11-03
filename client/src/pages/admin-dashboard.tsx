import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Users, Clock, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

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
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                No active quote requests
              </p>
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
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to add suppliers
              </p>
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
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting submissions
              </p>
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
              <div className="text-3xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                No data yet
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Quote Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quote requests yet</p>
                <p className="text-sm mt-2">Create your first RFQ to get started</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-md hover-elevate cursor-pointer">
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

                <div className="p-4 border border-border rounded-md hover-elevate cursor-pointer">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
