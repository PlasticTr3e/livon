import { Upload } from "lucide-react";
import { cn } from "@/components/ui/primitives";

type AdminNewsImageDropzoneProps = {
  file: File | null;
  inputId: string;
  isDragging: boolean;
  isUploading?: boolean;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (file: File | null) => void;
};

export function AdminNewsImageDropzone({
  file,
  inputId,
  isDragging,
  isUploading,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
}: AdminNewsImageDropzoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        isDragging
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-200 dark:border-gray-800",
      )}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
      />
      <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
      <p className="text-sm font-semibold text-gray-500 dark:text-white">
        {file ? file.name : "Klik atau Drag & Drop gambar di sini"}
      </p>
      {isUploading && (
        <p className="mt-2 animate-pulse text-xs text-green-500">
          Mengunggah...
        </p>
      )}
    </div>
  );
}
