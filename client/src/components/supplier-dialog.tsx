import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertSupplierSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Supplier } from "@shared/schema";

const supplierFormSchema = insertSupplierSchema.extend({
  certificationsInput: z.string().optional().default(""),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const { toast } = useToast();
  const isEditing = !!supplier;

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplierName: "",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      moq: "",
      leadTimes: "",
      paymentTerms: "",
      certifications: [],
      active: true,
      certificationsInput: "",
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        supplierName: supplier.supplierName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone ?? "",
        location: supplier.location ?? "",
        moq: supplier.moq ?? "",
        leadTimes: supplier.leadTimes ?? "",
        paymentTerms: supplier.paymentTerms ?? "",
        certifications: supplier.certifications ?? [],
        active: supplier.active,
        certificationsInput: "",
      });
    } else {
      form.reset({
        supplierName: "",
        contactPerson: "",
        email: "",
        phone: "",
        location: "",
        moq: "",
        leadTimes: "",
        paymentTerms: "",
        certifications: [],
        active: true,
        certificationsInput: "",
      });
    }
  }, [supplier, form]);

  const createMutation = useMutation({
    mutationFn: async (data: Omit<SupplierFormData, "certificationsInput">) => {
      return await apiRequest("/api/suppliers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier created",
        description: "The supplier has been successfully created.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Omit<SupplierFormData, "certificationsInput">) => {
      return await apiRequest(`/api/suppliers/${supplier?.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier updated",
        description: "The supplier has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    console.log("onSubmit called with data:", data);
    const { certificationsInput, ...supplierData } = data;
    
    const cleanedData = {
      ...supplierData,
      phone: supplierData.phone?.trim() || null,
      location: supplierData.location?.trim() || null,
      moq: supplierData.moq?.trim() || null,
      leadTimes: supplierData.leadTimes?.trim() || null,
      paymentTerms: supplierData.paymentTerms?.trim() || null,
    };
    
    console.log("Submitting cleaned data:", cleanedData);
    
    if (isEditing) {
      updateMutation.mutate(cleanedData);
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleAddCertification = () => {
    const input = form.getValues("certificationsInput")?.trim();
    if (input) {
      const currentCerts = form.getValues("certifications") || [];
      if (!currentCerts.includes(input)) {
        form.setValue("certifications", [...currentCerts, input]);
        form.setValue("certificationsInput", "");
      }
    }
  };

  const handleRemoveCertification = (cert: string) => {
    const currentCerts = form.getValues("certifications") || [];
    form.setValue(
      "certifications",
      currentCerts.filter((c) => c !== cert)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCertification();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const certifications = form.watch("certifications") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update supplier information and capabilities"
              : "Enter supplier details and contact information"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ABC Flavours Ltd."
                        data-testid="input-supplier-name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Smith"
                        data-testid="input-contact-person"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@supplier.com"
                        data-testid="input-email"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+61 2 1234 5678"
                        data-testid="input-phone"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Sydney, NSW, Australia"
                      data-testid="input-location"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="moq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MOQ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="1kg"
                        data-testid="input-moq"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Minimum order quantity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadTimes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Times</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="2-4 weeks"
                        data-testid="input-lead-times"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Net 30"
                        data-testid="input-payment-terms"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Certifications</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={form.watch("certificationsInput")}
                  onChange={(e) => form.setValue("certificationsInput", e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., ISO 9001, HACCP, Kosher"
                  data-testid="input-certification"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  onClick={handleAddCertification}
                  variant="outline"
                  data-testid="button-add-certification"
                  disabled={isPending}
                >
                  Add
                </Button>
              </div>
              {certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-cert-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Inactive suppliers will not be available for new quote requests
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-active"
                      disabled={isPending}
                    />
                  </FormControl>
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
                  ? "Update Supplier"
                  : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
