import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import type { QuoteRequest } from "@shared/schema";

type QuoteRequestWithCounts = QuoteRequest & {
  quotesReceived?: number;
  totalSuppliers?: number;
};

const statusColors = {
  draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function QuoteRequests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery<QuoteRequestWithCounts[]>({
    queryKey: ["/api/quote-requests"],
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.materialName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Quote Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all quote requests
          </p>
        </div>
        <Link href="/quote-requests/create">
          <Button data-testid="button-create-request">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading quote requests...</p>
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
            <div className="border border-border rounded-md">
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
                          {request.casNumber && (
                            <p className="text-xs text-muted-foreground">
                              CAS: {request.casNumber}
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
                        <Link href={`/quote-requests/${request.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-view-${request.id}`}
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredRequests.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredRequests.length} of {requests.length} quote request{requests.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
