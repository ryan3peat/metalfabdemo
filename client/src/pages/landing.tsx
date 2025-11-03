import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Mail, BarChart3, Shield, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">EF</span>
              </div>
              <h1 className="text-xl font-medium text-foreground">Essential Flavours</h1>
            </div>
            <Button asChild data-testid="button-header-login">
              <a href="/api/login">LOG IN</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-7xl w-full space-y-12 py-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl font-medium text-foreground">
              Supplier Portal
            </h2>
            <p className="text-lg text-muted-foreground">
              Streamline your procurement workflows with role-based access, automated RFQ distribution, and comprehensive quote management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-chart-1/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-chart-1" />
                </div>
                <CardTitle className="text-xl font-semibold">Quote Request Management</CardTitle>
                <CardDescription>
                  Create and distribute RFQs to multiple suppliers with automated email tracking and deadline management.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-chart-2" />
                </div>
                <CardTitle className="text-xl font-semibold">Supplier Directory</CardTitle>
                <CardDescription>
                  Maintain a comprehensive database of suppliers with contact information, certifications, and capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle className="text-xl font-semibold">Email Notifications</CardTitle>
                <CardDescription>
                  Automated email delivery with engagement tracking and token-based quote submission for suppliers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-chart-4/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-chart-4" />
                </div>
                <CardTitle className="text-xl font-semibold">Quote Comparison</CardTitle>
                <CardDescription>
                  Compare supplier quotes side-by-side with pricing analytics and trend visualization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-chart-5/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-chart-5" />
                </div>
                <CardTitle className="text-xl font-semibold">Role-Based Access</CardTitle>
                <CardDescription>
                  Secure authentication with admin, procurement, and supplier roles managing appropriate permissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Audit Trail</CardTitle>
                <CardDescription>
                  Track all system activities with comprehensive logging for compliance and accountability.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-medium text-foreground">Ready to get started?</h3>
              <p className="text-muted-foreground">
                Access the portal with your authorized credentials
              </p>
            </div>
            <Button size="lg" asChild data-testid="button-main-login">
              <a href="/api/login" className="text-sm font-medium uppercase tracking-wider">
                LOG IN TO PORTAL
              </a>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground border-t border-border pt-8">
            <p>Essential Flavours Supplier Portal • Secure Procurement Management</p>
          </div>
        </div>
      </main>
    </div>
  );
}
