import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Building2, Wrench, Package, Award, Sparkles, Factory, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const applicationSchema = z.object({
  // Step 1: Company Information
  companyName: z.string().min(1, "Company name is required"),
  abn: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("Australia"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  website: z.string().optional(),

  // Step 2: Capabilities
  servicesOffered: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),

  // Step 3: Materials & Stock
  materialTypes: z.array(z.string()).default([]),
  stockLevels: z.string().optional(),
  certifications: z.array(z.string()).default([]),

  // Step 4: Quality Management
  isoCertifications: z.array(z.string()).default([]),
  qualityProcesses: z.string().optional(),
  qualityDocumentation: z.array(z.string()).default([]),

  // Step 5: Welding & Surface Treatment
  weldingCapabilities: z.array(z.string()).default([]),
  surfaceTreatmentOptions: z.array(z.string()).default([]),

  // Step 6: Capacity
  productionCapacity: z.string().optional(),
  leadTimes: z.string().optional(),
  equipmentList: z.array(z.string()).default([]),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, name: "Company Information", icon: Building2 },
  { id: 2, name: "Capabilities", icon: Wrench },
  { id: 3, name: "Materials & Stock", icon: Package },
  { id: 4, name: "Quality Management", icon: Award },
  { id: 5, name: "Welding & Surface Treatment", icon: Sparkles },
  { id: 6, name: "Capacity", icon: Factory },
  { id: 7, name: "Review & Submit", icon: CheckCircle2 },
];

const serviceOptions = [
  "Cutting", "Bending", "Welding", "Machining", "Assembly", "Fabrication",
  "CNC Machining", "Laser Cutting", "Plasma Cutting", "Waterjet Cutting",
  "Powder Coating", "Anodizing", "Painting", "Polishing"
];

const materialOptions = [
  "Steel", "Stainless Steel", "Aluminum", "Copper", "Brass", "Bronze", "Titanium"
];

const certificationOptions = [
  "ISO 9001", "ISO 14001", "AS/NZS 4801", "OHSAS 18001", "Welding Certifications"
];

const isoOptions = [
  "ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018", "AS9100", "IATF 16949"
];

const weldingOptions = [
  "TIG Welding", "MIG Welding", "Stick Welding", "Plasma Welding", "Laser Welding"
];

const surfaceTreatmentOptions = [
  "Powder Coating", "Anodizing", "Galvanizing", "Painting", "Polishing", "Brushing"
];

export default function ApproveSupplier() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      companyName: "",
      abn: "",
      address: "",
      city: "",
      state: "",
      postcode: "",
      country: "Australia",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      servicesOffered: [],
      specializations: [],
      equipment: [],
      materialTypes: [],
      stockLevels: "",
      certifications: [],
      isoCertifications: [],
      qualityProcesses: "",
      qualityDocumentation: [],
      weldingCapabilities: [],
      surfaceTreatmentOptions: [],
      productionCapacity: "",
      leadTimes: "",
      equipmentList: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return apiRequest("/api/supplier-applications", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-applications"] });
      toast({
        title: "Success",
        description: "Supplier application submitted successfully",
      });
      setLocation("/supplier-applications");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    submitMutation.mutate(data);
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any);
      if (!isValid) return;
    }
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof ApplicationFormData)[] => {
    switch (step) {
      case 1:
        return ["companyName", "contactPerson", "email"];
      default:
        return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12 345 678 901" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="servicesOffered"
              render={() => (
                <FormItem>
                  <FormLabel>Services Offered</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {serviceOptions.map((service) => (
                      <FormField
                        key={service}
                        control={form.control}
                        name="servicesOffered"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(service)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, service])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== service)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{service}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specializations</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your specializations..."
                      value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map(v => v.trim()).filter(v => v);
                        field.onChange(values);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List your equipment..."
                      value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map(v => v.trim()).filter(v => v);
                        field.onChange(values);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="materialTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Material Types</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {materialOptions.map((material) => (
                      <FormField
                        key={material}
                        control={form.control}
                        name="materialTypes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(material)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, material])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== material)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{material}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockLevels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Levels</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe your stock levels..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certifications"
              render={() => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {certificationOptions.map((cert) => (
                      <FormField
                        key={cert}
                        control={form.control}
                        name="certifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(cert)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, cert])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== cert)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{cert}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isoCertifications"
              render={() => (
                <FormItem>
                  <FormLabel>ISO Certifications</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {isoOptions.map((iso) => (
                      <FormField
                        key={iso}
                        control={form.control}
                        name="isoCertifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(iso)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, iso])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== iso)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{iso}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualityProcesses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Processes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe your quality processes..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualityDocumentation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Documentation</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List quality documentation available..."
                      value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map(v => v.trim()).filter(v => v);
                        field.onChange(values);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="weldingCapabilities"
              render={() => (
                <FormItem>
                  <FormLabel>Welding Capabilities</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {weldingOptions.map((welding) => (
                      <FormField
                        key={welding}
                        control={form.control}
                        name="weldingCapabilities"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(welding)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, welding])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== welding)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{welding}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surfaceTreatmentOptions"
              render={() => (
                <FormItem>
                  <FormLabel>Surface Treatment Options</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {surfaceTreatmentOptions.map((treatment) => (
                      <FormField
                        key={treatment}
                        control={form.control}
                        name="surfaceTreatmentOptions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(treatment)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, treatment])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== treatment)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{treatment}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="productionCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Capacity</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe your production capacity..." />
                  </FormControl>
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
                    <Textarea {...field} placeholder="Describe typical lead times..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipmentList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment List</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List your equipment inventory..."
                      value={Array.isArray(field.value) ? field.value.join(", ") : field.value || ""}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map(v => v.trim()).filter(v => v);
                        field.onChange(values);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 7:
        const formData = form.getValues();
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Company:</strong> {formData.companyName}</p>
                <p><strong>ABN:</strong> {formData.abn || "N/A"}</p>
                <p><strong>Contact:</strong> {formData.contactPerson}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone || "N/A"}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {formData.servicesOffered.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Materials</h3>
              <div className="flex flex-wrap gap-2">
                {formData.materialTypes.map((m) => (
                  <Badge key={m} variant="secondary">{m}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approve Supplier</h1>
        <p className="text-muted-foreground">Submit a supplier application</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Application</CardTitle>
              <CardDescription>
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-2 text-center">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                {currentStep < 7 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

