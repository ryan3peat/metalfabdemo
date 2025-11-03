import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RawMaterial } from "@shared/schema";

const materialFormSchema = z.object({
  materialName: z.string().min(1, "Material name is required"),
  casNumber: z.string().min(1, "CAS number is required"),
  femaNumber: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(["natural", "synthetic", "natural_identical"]),
  form: z.enum(["liquid", "powder", "paste"]),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

interface RawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: RawMaterial;
}

export function RawMaterialDialog({
  open,
  onOpenChange,
  material,
}: RawMaterialDialogProps) {
  const { toast } = useToast();
  const isEditing = !!material;

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      materialName: "",
      casNumber: "",
      femaNumber: "",
      description: "",
      category: "natural",
      form: "liquid",
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        materialName: material.materialName,
        casNumber: material.casNumber,
        femaNumber: material.femaNumber ?? "",
        description: material.description ?? "",
        category: material.category,
        form: material.form,
      });
    } else {
      form.reset({
        materialName: "",
        casNumber: "",
        femaNumber: "",
        description: "",
        category: "natural",
        form: "liquid",
      });
    }
  }, [material, form]);

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      // Convert empty strings to null for optional fields
      const cleanData = {
        ...data,
        femaNumber: data.femaNumber?.trim() || null,
        description: data.description?.trim() || null,
      };
      return await apiRequest("/api/raw-materials", "POST", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      toast({
        title: "Material created",
        description: "The raw material has been successfully created.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create raw material",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    createMutation.mutate(data);
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Edit Raw Material" : "Add New Raw Material"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update material information"
              : "Enter raw material details for your catalog"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="materialName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Vanillin"
                        data-testid="input-material-name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="casNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAS Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="121-33-5"
                        data-testid="input-cas-number"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="femaNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FEMA Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="3107"
                        data-testid="input-fema-number"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="synthetic">Synthetic</SelectItem>
                        <SelectItem value="natural_identical">Natural Identical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-form">
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="liquid">Liquid</SelectItem>
                      <SelectItem value="powder">Powder</SelectItem>
                      <SelectItem value="paste">Paste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about this material..."
                      rows={3}
                      data-testid="textarea-description"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Material"
                  : "Create Material"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
