import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, CheckCircle2, XCircle, UserPlus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import type { SupplierApplication } from "@shared/schema";

export default function SupplierApplicationDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const { data: application, isLoading } = useQuery<SupplierApplication>({
    queryKey: [`/api/supplier-applications/${id}`],
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      return apiRequest(`/api/supplier-applications/${id}/status`, "PATCH", {
        status,
        reviewNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-applications"] });
      queryClient.invalidateQueries({ queryKey: [`/api/supplier-applications/${id}`] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
      setApproveDialogOpen(false);
      setRejectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const convertToSupplierMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/supplier-applications/${id}/approve`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      setConvertDialogOpen(false);
      setLocation("/suppliers");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert application to supplier",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: "approved", notes: reviewNotes });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: "rejected", notes: reviewNotes });
  };

  const handleConvert = () => {
    convertToSupplierMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Application not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/supplier-applications")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{application.companyName}</h1>
            <p className="text-muted-foreground">Supplier Application Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(application.status)}
          {application.status === "pending" && (
            <>
              <Button
                variant="default"
                onClick={() => setApproveDialogOpen(true)}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          {application.status === "approved" && (
            <Button
              variant="default"
              onClick={() => setConvertDialogOpen(true)}
              disabled={convertToSupplierMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Company Name</Label>
              <p className="font-medium">{application.companyName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">ABN</Label>
              <p>{application.abn || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p>
                {application.address || ""}
                {application.city && `, ${application.city}`}
                {application.state && `, ${application.state}`}
                {application.postcode && ` ${application.postcode}`}
                {application.country && `, ${application.country}`}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Contact Person</Label>
              <p className="font-medium">{application.contactPerson}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p>{application.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p>{application.phone || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Website</Label>
              <p>{application.website || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Services Offered</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.servicesOffered) && application.servicesOffered.length > 0 ? (
                  application.servicesOffered.map((service, idx) => (
                    <Badge key={idx} variant="secondary">{service}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Specializations</Label>
              <p>{Array.isArray(application.specializations) ? application.specializations.join(", ") : "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Equipment</Label>
              <p>{Array.isArray(application.equipment) ? application.equipment.join(", ") : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materials & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Material Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.materialTypes) && application.materialTypes.length > 0 ? (
                  application.materialTypes.map((material, idx) => (
                    <Badge key={idx} variant="secondary">{material}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Stock Levels</Label>
              <p>{application.stockLevels || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Certifications</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.certifications) && application.certifications.length > 0 ? (
                  application.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="secondary">{cert}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">ISO Certifications</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.isoCertifications) && application.isoCertifications.length > 0 ? (
                  application.isoCertifications.map((iso, idx) => (
                    <Badge key={idx} variant="secondary">{iso}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Quality Processes</Label>
              <p>{application.qualityProcesses || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Quality Documentation</Label>
              <p>{Array.isArray(application.qualityDocumentation) ? application.qualityDocumentation.join(", ") : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welding & Surface Treatment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Welding Capabilities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.weldingCapabilities) && application.weldingCapabilities.length > 0 ? (
                  application.weldingCapabilities.map((welding, idx) => (
                    <Badge key={idx} variant="secondary">{welding}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Surface Treatment Options</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(application.surfaceTreatmentOptions) && application.surfaceTreatmentOptions.length > 0 ? (
                  application.surfaceTreatmentOptions.map((treatment, idx) => (
                    <Badge key={idx} variant="secondary">{treatment}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">None specified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Production Capacity</Label>
              <p>{application.productionCapacity || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Lead Times</Label>
              <p>{application.leadTimes || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Equipment List</Label>
              <p>{Array.isArray(application.equipmentList) ? application.equipmentList.join(", ") : "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {application.reviewDate && (
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Review Date</Label>
              <p>{format(new Date(application.reviewDate), "MMM dd, yyyy 'at' h:mm a")}</p>
            </div>
            {application.reviewNotes && (
              <div>
                <Label className="text-muted-foreground">Review Notes</Label>
                <p>{application.reviewNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this supplier application? You can add review notes below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Review Notes (Optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this supplier application? Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!reviewNotes.trim()}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new supplier record from this approved application. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>Convert</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




