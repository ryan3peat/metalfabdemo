import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function SupplierDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-medium text-foreground">Supplier Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {user?.companyName || user?.firstName || 'Supplier'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pending Requests
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-chart-3" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                No pending quote requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Awaiting Response
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                All caught up
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Quotes Submitted
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                No submissions yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Acceptance Rate
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-chart-2" />
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

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quote Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quote requests received yet</p>
                <p className="text-sm mt-2">You'll be notified when Essential Flavours sends you a quote request</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
