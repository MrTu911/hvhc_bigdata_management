
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Database,
  FileImage,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResearchFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: string;
  classification: string;
  uploadedAt: string;
  downloadCount: number;
}

export default function FilesPage() {
  const [files, setFiles] = useState<ResearchFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadConfig, setUploadConfig] = useState({
    fileType: "DATASET",
    classification: "INTERNAL",
    department: "",
    title: "",
    description: "",
  });

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files/upload");
      const data = await res.json();
      
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadConfig(prev => ({
        ...prev,
        title: file.name,
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileType", uploadConfig.fileType);
      formData.append("classification", uploadConfig.classification);
      formData.append("department", uploadConfig.department);
      formData.append("title", uploadConfig.title);
      formData.append("description", uploadConfig.description);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("File uploaded successfully!");
        setSelectedFile(null);
        fetchFiles();
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/files/download/${fileId}`);
      const data = await res.json();

      if (data.success) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = fileName;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Download failed: " + data.error);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`/api/files/delete/${fileId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("File deleted successfully");
        fetchFiles();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "DATASET":
        return <Database className="h-5 w-5" />;
      case "RESEARCH_PAPER":
        return <FileText className="h-5 w-5" />;
      case "PRESENTATION":
        return <FileImage className="h-5 w-5" />;
      default:
        return <FileSpreadsheet className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-muted-foreground">
            Upload, manage, and download research files and datasets
          </p>
        </div>
        <Button onClick={fetchFiles} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
          <CardDescription>
            Upload datasets, research papers, or other files to cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">File Type</Label>
              <Select
                value={uploadConfig.fileType}
                onValueChange={(value) =>
                  setUploadConfig(prev => ({ ...prev, fileType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DATASET">Dataset</SelectItem>
                  <SelectItem value="RESEARCH_PAPER">Research Paper</SelectItem>
                  <SelectItem value="MODEL">ML Model</SelectItem>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="PRESENTATION">Presentation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classification">Classification</Label>
              <Select
                value={uploadConfig.classification}
                onValueChange={(value) =>
                  setUploadConfig(prev => ({ ...prev, classification: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                  <SelectItem value="SECRET">Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={uploadConfig.department}
                onChange={(e) =>
                  setUploadConfig(prev => ({ ...prev, department: e.target.value }))
                }
                placeholder="e.g., Research Department"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadConfig.title}
                onChange={(e) =>
                  setUploadConfig(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="File title"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={uploadConfig.description}
                onChange={(e) =>
                  setUploadConfig(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description"
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>
            {files.length} files stored in cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files uploaded yet
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1">
                      <div className="font-medium">{file.fileName}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {file.classification}
                        </Badge>
                        <span>•</span>
                        <span>
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{file.downloadCount} downloads</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        file.status === "COMPLETED" ? "default" :
                        file.status === "PROCESSING" ? "outline" :
                        "secondary"
                      }
                    >
                      {file.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.fileName)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
