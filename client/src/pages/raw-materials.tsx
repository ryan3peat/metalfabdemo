import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import type { RawMaterial } from "@shared/schema";
import { RawMaterialDialog } from "@/components/raw-material-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RawMaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | undefined>(undefined);

  const { data: materials, isLoading } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  const handleAdd = () => {
    setSelectedMaterial(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };

  const filteredMaterials = materials?.filter((material) => {
    const matchesSearch =
      searchQuery === "" ||
      material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.casNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.femaNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || material.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-materials-heading">
            Raw Materials
          </h1>
          <p className="text-muted-foreground">
            Manage the catalog of raw materials available for quote requests
          </p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-material">
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, CAS number, or FEMA number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="synthetic">Synthetic</SelectItem>
              <SelectItem value="natural_identical">Natural Identical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading materials...
          </div>
        ) : !filteredMaterials || filteredMaterials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || categoryFilter !== "all"
              ? "No materials match your filters"
              : "No materials found. Add your first raw material to get started."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>CAS Number</TableHead>
                  <TableHead>FEMA Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                    <TableCell className="font-medium">{material.materialName}</TableCell>
                    <TableCell>{material.casNumber}</TableCell>
                    <TableCell>{material.femaNumber || "—"}</TableCell>
                    <TableCell className="capitalize">
                      {material.category.replace("_", " ")}
                    </TableCell>
                    <TableCell className="capitalize">{material.form}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(material)}
                        data-testid={`button-edit-${material.id}`}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredMaterials?.length || 0} material(s) found
        </div>
      </Card>

      <RawMaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={selectedMaterial}
      />
    </div>
  );
}
