import { X } from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";
import { AdminNewsImageDropzone } from "./AdminNewsImageDropzone";

type AdminNewsFormModalProps = {
  content: string;
  file: File | null;
  inputId: string;
  isDragging: boolean;
  isSaving: boolean;
  isUploading?: boolean;
  title: string;
  submitLabel: string;
  modalTitle: string;
  onCancel: () => void;
  onContentChange: (content: string) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTitleChange: (title: string) => void;
};

export function AdminNewsFormModal({
  content,
  file,
  inputId,
  isDragging,
  isSaving,
  isUploading,
  title,
  submitLabel,
  modalTitle,
  onCancel,
  onContentChange,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  onSubmit,
  onTitleChange,
}: AdminNewsFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 pb-6 pt-24 md:pt-28">
      <div className="relative w-full max-w-lg overflow-y-auto rounded-xl bg-white p-8 shadow-lg dark:bg-[#111827] md:max-h-[calc(100dvh-8rem)]">
        <button
          className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
          onClick={onCancel}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-lg font-bold">{modalTitle}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Article Title
            </label>
            <Input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
              minLength={5}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Content</label>
            <textarea
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-[#1F2937]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Thumbnail Upload
            </label>
            <AdminNewsImageDropzone
              file={file}
              inputId={inputId}
              isDragging={isDragging}
              isUploading={isUploading}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onFileChange={onFileChange}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSaving ? "Saving..." : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
