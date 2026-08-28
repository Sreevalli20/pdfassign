import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
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
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    processFile(selectedFile);
  };

  const processFile = async (selectedFile: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF or image file (PNG, JPG).');
      return;
    }
    
    // Validate file size (max 15MB for backend compatibility)
    const maxSize = 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB.`);
      return;
    }
    
    setOriginalSize(selectedFile.size);
    setIsCompressing(true);
    
    try {
      let processedFile: File;
      if (selectedFile.type === 'application/pdf') {
        processedFile = await compressPDF(selectedFile);
      } else {
        processedFile = await compressImage(selectedFile);
      }
      
      onFileSelect(processedFile);
    } catch (error) {
      console.error('File processing failed:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setIsCompressing(false);
      setOriginalSize(null);
    }
  };

  const compressPDF = async (file: File): Promise<File> => {
    // For PDFs, we can't easily compress in browser without libraries
    // We'll just validate and return the original file
    // The backend will handle size validation
    return file;
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1920px)
          const maxDimension = 1920;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            file.type,
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUpload] File input changed');
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('[FileUpload] File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
      handleFileSelect(selectedFile);
    } else {
      console.log('[FileUpload] No file selected');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
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
          {isCompressing ? (
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          ) : file && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
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
              className="hidden"
              onChange={handleFileChange}
              accept={accept}
              id={`file-input-${title.replace(/\s+/g, '-').toLowerCase()}`}
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
              <button
                type="button"
                className="rounded-lg bg-[#6D28D9] text-white border-[#6D28D9] hover:bg-[#5B21B6] hover:border-[#5B21B6] font-semibold px-4 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 cursor-pointer"
                onClick={() => {
                  console.log('[FileUpload] Browse Files button clicked');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  } else {
                    console.error('[FileUpload] fileInputRef.current is null');
                  }
                }}
              >
                Browse Files
              </button>
            </div>
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
                    {originalSize && originalSize !== file.size && (
                      <span className="text-green-600 ml-1">
                        (reduced from {formatFileSize(originalSize)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[FileUpload] Replace file button clicked');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    } else {
                      console.error('[FileUpload] fileInputRef.current is null');
                    }
                  }}
                  className="h-8 w-8 hover:bg-purple-100 hover:text-purple-600 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                  title="Replace file"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onFileRemove}
                  className="h-8 w-8 hover:bg-red-100 hover:text-red-600 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
