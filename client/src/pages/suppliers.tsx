import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SupplierDialog } from "@/components/supplier-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Building2,
  Mail,
  FileText
} from "lucide-react";
import type { Supplier } from "@shared/schema";

export default function Suppliers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await apiRequest(`/api/suppliers/${supplierId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier deleted",
        description: "The supplier has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
    }
  };

  const handleAddClick = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const filteredSuppliers = suppliers?.filter((supplier) => {
    const matchesSearch =
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && supplier.active) ||
      (statusFilter === "inactive" && !supplier.active);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-secondary">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
            Supplier Management
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Manage your supplier directory and relationships
          </p>
        </div>
        <Button onClick={handleAddClick} data-testid="button-add-supplier" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-2 space-y-0 pb-4">
          <CardTitle className="text-xl">Suppliers</CardTitle>
          <CardDescription>
            {filteredSuppliers?.length || 0} supplier(s) found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-suppliers"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSuppliers && filteredSuppliers.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-secondary" />
                            <div>
                              <div className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                                {supplier.supplierName}
                              </div>
                              {supplier.certifications && supplier.certifications.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {supplier.certifications.slice(0, 2).map((cert, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {cert}
                                    </Badge>
                                  ))}
                                  {supplier.certifications.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{supplier.certifications.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-contact-person-${supplier.id}`}>
                          {supplier.contactPerson}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-secondary" />
                            <span className="text-sm" data-testid={`text-email-${supplier.id}`}>
                              {supplier.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={supplier.active ? "default" : "outline"}
                            data-testid={`badge-status-${supplier.id}`}
                          >
                            {supplier.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditClick(supplier)}
                              data-testid={`button-edit-${supplier.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteClick(supplier)}
                              data-testid={`button-delete-${supplier.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.id} className="hover-elevate">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Building2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate" data-testid={`text-supplier-name-${supplier.id}`}>
                              {supplier.supplierName}
                            </h3>
                            {supplier.certifications && supplier.certifications.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {supplier.certifications.slice(0, 2).map((cert, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                                {supplier.certifications.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{supplier.certifications.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={supplier.active ? "default" : "outline"}
                          data-testid={`badge-status-${supplier.id}`}
                          className="flex-shrink-0"
                        >
                          {supplier.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <p className="font-medium" data-testid={`text-contact-person-${supplier.id}`}>
                            {supplier.contactPerson}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-secondary" />
                            <span className="font-medium break-all" data-testid={`text-email-${supplier.id}`}>
                              {supplier.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(supplier)}
                          data-testid={`button-edit-${supplier.id}`}
                          className="flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(supplier)}
                          data-testid={`button-delete-${supplier.id}`}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
              <p className="text-secondary text-sm mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={handleAddClick} data-testid="button-add-first-supplier">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.supplierName}"? This action cannot be undone.
              All associated quote requests and quotes will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
