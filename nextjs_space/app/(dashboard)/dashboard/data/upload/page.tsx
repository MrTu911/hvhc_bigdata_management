'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUpload {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

export default function DataUploadPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  const translations = {
    vi: {
      pageTitle: 'Tải lên Dataset / Nghiên cứu',
      pageDescription: 'Tải lên và quản lý các file dữ liệu, dataset nghiên cứu của bạn',
      uploadInfo: 'Thông tin tải lên',
      title: 'Tiêu đề',
      titlePlaceholder: 'Nhập tiêu đề dataset/nghiên cứu',
      description: 'Mô tả',
      descriptionPlaceholder: 'Mô tả chi tiết về dữ liệu',
      category: 'Danh mục',
      selectCategory: 'Chọn danh mục',
      research: 'Nghiên cứu',
      dataset: 'Dataset',
      report: 'Báo cáo',
      thesis: 'Luận văn',
      other: 'Khác',
      tags: 'Tags',
      tagsPlaceholder: 'Nhập tags, ngăn cách bằng dấu phẩy',
      selectFiles: 'Chọn file',
      dragDrop: 'Kéo thả file vào đây hoặc click để chọn',
      supportedFormats: 'Hỗ trợ: CSV, Excel, JSON, TXT, PDF, ZIP',
      selectedFiles: 'File đã chọn',
      uploadAll: 'Tải lên tất cả',
      clear: 'Xóa tất cả',
      uploading: 'Đang tải lên...',
      success: 'Thành công',
      error: 'Lỗi',
      uploadSuccess: 'Tải lên thành công!',
      uploadError: 'Có lỗi xảy ra khi tải lên',
      fillRequired: 'Vui lòng điền đầy đủ thông tin bắt buộc'
    },
    en: {
      pageTitle: 'Upload Dataset / Research',
      pageDescription: 'Upload and manage your data files and research datasets',
      uploadInfo: 'Upload Information',
      title: 'Title',
      titlePlaceholder: 'Enter dataset/research title',
      description: 'Description',
      descriptionPlaceholder: 'Detailed description of the data',
      category: 'Category',
      selectCategory: 'Select category',
      research: 'Research',
      dataset: 'Dataset',
      report: 'Report',
      thesis: 'Thesis',
      other: 'Other',
      tags: 'Tags',
      tagsPlaceholder: 'Enter tags, separated by commas',
      selectFiles: 'Select Files',
      dragDrop: 'Drag and drop files here or click to select',
      supportedFormats: 'Supported: CSV, Excel, JSON, TXT, PDF, ZIP',
      selectedFiles: 'Selected Files',
      uploadAll: 'Upload All',
      clear: 'Clear All',
      uploading: 'Uploading...',
      success: 'Success',
      error: 'Error',
      uploadSuccess: 'Upload successful!',
      uploadError: 'An error occurred during upload',
      fillRequired: 'Please fill in all required fields'
    }
  };

  const lang = language === 'en' ? 'en' : 'vi';
  const tr = translations[lang];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileUpload[] = selectedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileUpload[] = droppedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!title || !category) {
      toast({
        title: tr.error,
        description: tr.fillRequired,
        variant: 'destructive'
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: tr.error,
        description: 'Please select at least one file',
        variant: 'destructive'
      });
      return;
    }

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => {
        const updated = [...prev];
        updated[i].status = 'uploading';
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append('file', files[i].file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('tags', tags);

        const response = await fetch('/api/data/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          const datasetId = result.data?.id;

          setFiles(prev => {
            const updated = [...prev];
            updated[i].status = 'success';
            updated[i].progress = 100;
            updated[i].message = `Uploaded successfully. ID: ${datasetId}`;
            return updated;
          });

          // Auto-trigger processing for supported file types
          const supportedTypes = ['.csv', '.xlsx', '.xls', '.json'];
          const fileExt = files[i].file.name.toLowerCase().match(/\.(csv|xlsx|xls|json)$/)?.[0];
          
          if (fileExt && supportedTypes.includes(fileExt) && datasetId) {
            // Trigger background processing
            fetch('/api/data/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ datasetId })
            }).catch(err => console.error('Processing error:', err));
          }
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setFiles(prev => {
          const updated = [...prev];
          updated[i].status = 'error';
          updated[i].message = 'Upload failed';
          return updated;
        });
      }
    }

    toast({
      title: tr.success,
      description: tr.uploadSuccess
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{tr.pageTitle}</h1>
        <p className="text-muted-foreground mt-2">{tr.pageDescription}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tr.uploadInfo}</CardTitle>
            <CardDescription>
              {lang === 'vi' ? 'Cung cấp thông tin về dữ liệu của bạn' : 'Provide information about your data'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{tr.title} *</Label>
              <Input
                id="title"
                placeholder={tr.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tr.description}</Label>
              <Textarea
                id="description"
                placeholder={tr.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{tr.category} *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={tr.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">{tr.research}</SelectItem>
                  <SelectItem value="dataset">{tr.dataset}</SelectItem>
                  <SelectItem value="report">{tr.report}</SelectItem>
                  <SelectItem value="thesis">{tr.thesis}</SelectItem>
                  <SelectItem value="other">{tr.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{tr.tags}</Label>
              <Input
                id="tags"
                placeholder={tr.tagsPlaceholder}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tr.selectFiles}</CardTitle>
            <CardDescription>{tr.supportedFormats}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{tr.dragDrop}</p>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.zip"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{tr.selectedFiles} ({files.length})</Label>
                  <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                    {tr.clear}
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((fileUpload, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {fileUpload.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {fileUpload.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {fileUpload.status === 'uploading' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                        )}
                        {fileUpload.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUpload}
                  className="w-full"
                  disabled={files.some(f => f.status === 'uploading')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {tr.uploadAll}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
