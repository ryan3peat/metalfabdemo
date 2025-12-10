import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { QuoteRequest } from "@shared/schema";

type QuoteRequestWithCounts = QuoteRequest & {
  quotesReceived: number;
  totalSuppliers: number;
  hasPendingDocs: boolean;
};

const statusColors = {
  draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function QuoteRequests() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialFilter = searchParams.get('filter') || 'all';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update filter when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const filter = params.get('filter') || 'all';
    setStatusFilter(filter);
  }, [location]);

  // Handle filter change and update URL
  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    // Update URL to reflect filter choice
    if (newFilter === 'all') {
      setLocation('/quote-requests');
    } else {
      setLocation(`/quote-requests?filter=${newFilter}`);
    }
  };

  const { data: requests = [], isLoading } = useQuery<QuoteRequestWithCounts[]>({
    queryKey: ["/api/quote-requests"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete quote request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Deleted",
        description: "The quote request has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quote-requests'] });
      setDeleteRequestId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.materialName.toLowerCase().includes(searchQuery.toLowerCase());

    // Handle status filter including pending-docs special case
    let matchesStatus = true;
    if (statusFilter === "pending-docs") {
      matchesStatus = request.hasPendingDocs === true;
      // Debug logging
      console.log(`[DEBUG] Filtering for pending-docs: Request ${request.requestNumber}, hasPendingDocs=${request.hasPendingDocs}, matches=${matchesStatus}`);
    } else if (statusFilter !== "all") {
      matchesStatus = request.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Debug logging for filter state
  console.log(`[DEBUG] Current statusFilter: "${statusFilter}", Total requests: ${requests.length}, Filtered: ${filteredRequests.length}`);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Quote Requests</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage and track all quote requests
          </p>
        </div>
        <Link href="/quote-requests/create" className="w-full sm:w-auto">
          <Button data-testid="button-create-request" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by RFQ number or material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select key={statusFilter} value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-all">All Statuses</SelectItem>
                <SelectItem value="pending-docs" data-testid="filter-pending-docs">Pending Docs</SelectItem>
                <SelectItem value="draft" data-testid="filter-draft">Draft</SelectItem>
                <SelectItem value="active" data-testid="filter-active">Active</SelectItem>
                <SelectItem value="closed" data-testid="filter-closed">Closed</SelectItem>
                <SelectItem value="cancelled" data-testid="filter-cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-md">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== "all" 
                  ? "No requests found" 
                  : "No quote requests yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Create your first quote request to start requesting quotes from suppliers"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link href="/quote-requests/create">
                  <Button data-testid="button-create-first">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote Request
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            {/* Desktop Table View */}
            <div className="hidden md:block border border-border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Quotes</TableHead>
                    <TableHead>Submit By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow 
                      key={request.id}
                      data-testid={`row-request-${request.id}`}
                    >
                      <TableCell className="font-medium">
                        <span data-testid={`text-rfq-${request.id}`}>
                          {request.requestNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm" data-testid={`text-material-${request.id}`}>
                            {request.materialName}
                          </p>
                          {request.materialType && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {request.materialType.replace("_", " ")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.quantityNeeded} {request.unitOfMeasure}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-medium" 
                            data-testid={`text-quotes-${request.id}`}
                          >
                            {request.quotesReceived ?? 0} / {request.totalSuppliers ?? 0}
                          </span>
                          {(request.quotesReceived ?? 0) > 0 && (
                            <Badge 
                              variant="outline" 
                              className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                            >
                              {request.quotesReceived}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.submitByDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[request.status]} uppercase text-xs font-semibold`}
                          data-testid={`badge-status-${request.id}`}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/quote-requests/${request.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-${request.id}`}
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteRequestId(request.id);
                            }}
                            data-testid={`button-delete-${request.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover-elevate">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" data-testid={`text-rfq-${request.id}`}>
                          {request.requestNumber}
                        </h3>
                        <p className="text-sm font-medium mt-1" data-testid={`text-material-${request.id}`}>
                          {request.materialName}
                        </p>
                        {request.materialType && (
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {request.materialType.replace("_", " ")}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusColors[request.status]} uppercase text-xs font-semibold flex-shrink-0`}
                        data-testid={`badge-status-${request.id}`}
                      >
                        {request.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-medium">{request.quantityNeeded} {request.unitOfMeasure}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quotes</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" data-testid={`text-quotes-${request.id}`}>
                            {request.quotesReceived ?? 0} / {request.totalSuppliers ?? 0}
                          </span>
                          {(request.quotesReceived ?? 0) > 0 && (
                            <Badge 
                              variant="outline" 
                              className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                            >
                              {request.quotesReceived}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Submit By</p>
                        <p className="font-medium">{format(new Date(request.submitByDate), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="font-medium">{format(new Date(request.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Link href={`/quote-requests/${request.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid={`button-view-${request.id}`}
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteRequestId(request.id);
                        }}
                        data-testid={`button-delete-${request.id}`}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredRequests.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRequests.length} of {requests.length} quote request{requests.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteRequestId} onOpenChange={(open) => !open && setDeleteRequestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote request? This action cannot be undone.
              All supplier quotes and associated documents will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequestId && deleteMutation.mutate(deleteRequestId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
