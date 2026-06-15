import { Upload } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

type AdminNewsImageDropzoneProps = {
  file: File | null;
  inputId: string;
  isDragging: boolean;
  isUploading?: boolean;
  previewUrl?: string;
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
  previewUrl,
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
      {previewUrl ? (
        <div className="mx-auto mb-3 h-20 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#111827]">
          <ImageWithFallback
            src={previewUrl}
            alt="Thumbnail preview"
            width={112}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
      )}
      <p className="text-sm font-semibold text-gray-500 dark:text-white">
        {file
          ? file.name
          : previewUrl
            ? "Click or drag to replace thumbnail"
            : "Click or drag image here"}
      </p>
      {isUploading && (
        <p className="mt-2 animate-pulse text-xs text-green-500">
          Uploading...
        </p>
      )}
    </div>
  );
}
