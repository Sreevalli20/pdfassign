import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or image file (PNG, JPG).');
      return;
    }
    
    // Validate file size (max 15MB for backend compatibility)
    const maxSize = 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB.`);
      return;
    }
    
    onFileSelect(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleReplace = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card className="border-2 border-purple-200 shadow-lg rounded-2xl overflow-hidden bg-white hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#18122B]">{title}</h3>
          {file && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </div>
        
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              isDragging
                ? "border-orange-500 bg-orange-50"
                : "border-purple-300 hover:border-orange-400 hover:bg-orange-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              onChange={handleFileChange}
              accept={accept}
            />
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDragging ? "bg-orange-100" : "bg-gradient-to-br from-orange-100 to-purple-100"
              }`}>
                <Upload className={`w-8 h-8 ${isDragging ? "text-orange-600" : "text-purple-600"}`} />
              </div>
              <p className="text-sm font-bold text-[#18122B] mb-1">
                {description}
              </p>
              <p className="text-xs text-[#6B6480] mb-4">
                PDF, PNG, JPG
              </p>
              <Button 
                type="button"
                size="sm" 
                className="rounded-lg bg-[#6D28D9] text-white border-2 border-[#6D28D9] hover:bg-[#5B21B6] hover:border-[#5B21B6] font-bold shadow-md hover:shadow-lg"
                onClick={handleBrowseClick}
              >
                Browse Files
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {file.type.includes("pdf") ? (
                    <FileText className="w-6 h-6 text-red-500" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-purple-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#18122B] truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#6B6480]">
                    {formatFileSize(file.size)} • {file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReplace}
                  className="h-8 w-8 hover:bg-purple-100 hover:text-purple-600"
                  title="Replace file"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onFileRemove}
                  className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
