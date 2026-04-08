'use client';

import { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const ACCEPTED_TYPES: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/html': 'HTML',
};

const ACCEPTED_EXTENSIONS = ['.docx', '.xlsx', '.html'];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface FileUploadZoneProps {
  /** Gọi khi file hợp lệ được chọn */
  onFileSelect: (file: File) => void;
  /** 0–100, hiển thị progress bar khi đang upload */
  uploadProgress?: number;
  /** Tắt tương tác khi đang upload */
  disabled?: boolean;
}

export function FileUploadZone({ onFileSelect, uploadProgress, disabled }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES[file.type]) {
      return `Chỉ chấp nhận file DOCX, XLSX hoặc HTML`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File vượt quá ${MAX_SIZE_MB}MB (kích thước: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validate, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // reset input để có thể chọn lại cùng file
      e.target.value = '';
    },
    [handleFile],
  );

  const clear = () => {
    setSelectedFile(null);
    setError(null);
  };

  const isUploading = uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100;

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
        className={[
          'rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-colors',
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
          disabled ? 'opacity-50 cursor-not-allowed' : selectedFile ? 'cursor-default' : 'cursor-pointer',
        ].join(' ')}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3 w-full">
            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {ACCEPTED_TYPES[selectedFile.type]} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => { e.stopPropagation(); clear(); }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              Kéo thả file vào đây hoặc{' '}
              <span className="text-blue-600 underline">chọn file</span>
            </p>
            <p className="text-xs text-gray-400">
              {ACCEPTED_EXTENSIONS.join(', ')} · tối đa {MAX_SIZE_MB}MB
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-1.5" />
          <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
