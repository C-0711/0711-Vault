// V-11: Drag-and-Drop Multi-File Upload
import React, { useCallback, useState } from "react";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface Props {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
}

export function DragDropUpload({ onUpload, accept = "*/*", maxFiles = 10, maxSize = 104857600 }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles).filter(f => f.size <= maxSize);
    if (!droppedFiles.length) return;
    
    const newFiles: UploadFile[] = droppedFiles.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      progress: 0,
      status: "pending"
    }));
    setFiles(prev => [...prev, ...newFiles]);
    
    try {
      await onUpload(droppedFiles);
      setFiles(prev => prev.map(f => droppedFiles.includes(f.file) ? { ...f, status: "complete", progress: 100 } : f));
    } catch (e) {
      setFiles(prev => prev.map(f => droppedFiles.includes(f.file) ? { ...f, status: "error", error: String(e) } : f));
    }
  }, [onUpload, maxFiles, maxSize]);

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <p className="text-lg font-medium">{isDragging ? "Drop files here" : "Drag & drop files"}</p>
      <p className="text-sm text-gray-500">or click to browse (max {maxFiles} files, {Math.round(maxSize/1024/1024)}MB each)</p>
      
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <span className="flex-1 truncate text-sm">{f.file.name}</span>
              {f.status === "complete" && <span className="text-green-500">✓</span>}
              {f.status === "error" && <span className="text-red-500">✗</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
