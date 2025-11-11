import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Trash2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  uploadedAt: string;
}

interface DocumentRequest {
  id: string;
  requestedDocuments: string[];
  requestedAt: string;
  status: string;
}

interface DocumentManagerProps {
  quoteId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  requestedDocuments?: string[];
}

const DOCUMENT_LABELS: Record<string, string> = {
  coa: "Certificate of Analysis (COA)",
  pif: "PIF",
  specification: "Specification",
  sds: "SDS",
  halal: "Halal Certificate",
  kosher: "Kosher Certificate",
  natural_status: "Natural Status",
  process_flow: "Process Flow",
  gfsi_cert: "GFSI Certificate",
  organic: "Organic Certificate",
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_LABELS).map(key => ({
  value: key,
  label: DOCUMENT_LABELS[key],
}));

export default function DocumentManager({
  quoteId,
  canUpload = false,
  canDelete = false,
  requestedDocuments = [],
}: DocumentManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/supplier/quotes', quoteId, 'documents'],
    enabled: !!quoteId,
  });

  // Fetch document requests (what admin requested)
  const { data: documentRequestsData = [] } = useQuery<DocumentRequest[]>({
    queryKey: ['/api/quotes', quoteId, 'document-requests'],
    enabled: !!quoteId && canUpload, // Only fetch if supplier can upload
    queryFn: async () => {
      const response = await fetch(`/api/quotes/${quoteId}/document-requests`, {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch document requests');
      }
      return response.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, docType }: { file: File; docType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      const response = await fetch(`/api/supplier/quotes/${quoteId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Document has been uploaded successfully.",
      });
      setSelectedFile(null);
      setDocumentType("");
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/quotes', quoteId, 'documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/supplier/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/quotes', quoteId, 'documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, docType: documentType });
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'document';

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadedDocTypes = documents.map(doc => doc.documentType);

  // Merge requested documents from props and from document requests
  const allRequestedDocs = [
    ...requestedDocuments,
    ...documentRequestsData.flatMap(req => req.requestedDocuments)
  ];
  const uniqueRequestedDocs = [...new Set(allRequestedDocs)];

  const requestedDocTypes = uniqueRequestedDocs.length > 0
    ? uniqueRequestedDocs
    : DOCUMENT_TYPES.map(d => d.value);

  const missingDocuments = requestedDocTypes.filter(type => !uploadedDocTypes.includes(type));

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload required documentation for this quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((doc) => (
                    <SelectItem key={doc.value} value={doc.value}>
                      {doc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size.toString())}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <label htmlFor="file-upload">
                      <span className="text-sm text-primary font-medium cursor-pointer hover:underline">
                        Click to upload
                      </span>
                    </label>
                    <span className="text-sm text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, XLSX, JPG, PNG (max 10MB)
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {requestedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              {documents.length} of {requestedDocuments.length} requested documents uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requestedDocTypes.map((docType) => {
                const isUploaded = uploadedDocTypes.includes(docType);
                return (
                  <div key={docType} className="flex items-center gap-2 text-sm">
                    {isUploaded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className={isUploaded ? "text-foreground" : "text-muted-foreground"}>
                      {DOCUMENT_LABELS[docType]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{DOCUMENT_LABELS[doc.documentType]}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
