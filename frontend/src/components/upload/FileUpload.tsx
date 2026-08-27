import { useState, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadedFile } from "@/types/assessment";

interface FileUploadProps {
  title: string;
  description: string;
  file: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept: string;
}

export function FileUpload({
  title,
  description,
  file,
  onFileSelect,
  onFileRemove,
  accept,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card className="p-6 shadow-md border-0">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {file && (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id={`file-${title}`}
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
          />
          <label
            htmlFor={`file-${title}`}
            className="cursor-pointer flex flex-col items-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDragging ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <Upload className={`w-8 h-8 ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, PNG, JPG, JPEG (max 50MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                {file.type.includes("pdf") ? (
                  <FileText className="w-6 h-6 text-red-500" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(file.size)} • {file.type.split("/")[1].toUpperCase()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFileRemove}
              className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
