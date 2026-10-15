"use client";

import { useRef, type ChangeEvent, type Ref } from "react";
import { ImagePlus, X } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import type {
  CommunityAuthor,
  CommunityDraftItem,
} from "@/lib/community/community-types";
import { CommunityAvatar } from "./CommunityAvatar";

type CommunityComposerThreadItemProps = {
  author: CommunityAuthor;
  isFirst: boolean;
  item: CommunityDraftItem;
  textareaRef?: Ref<HTMLTextAreaElement>;
  onImageChange: (itemId: string, image: string | null) => void;
  onRemove?: (itemId: string) => void;
  onTextChange: (itemId: string, text: string) => void;
};

export function CommunityComposerThreadItem({
  author,
  isFirst,
  item,
  textareaRef,
  onImageChange,
  onRemove,
  onTextChange,
}: CommunityComposerThreadItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";
    if (!file) return;

    onImageChange(item.id, URL.createObjectURL(file));
  }

  return (
    <div className="flex gap-3">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <CommunityAvatar author={author} />
        <div className="mt-2 min-h-5 w-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div className="mb-1.5 flex h-6 items-center justify-between">
          <span className="truncate text-sm font-bold text-gray-900 dark:text-white">
            {author.name}
          </span>
          {onRemove && (
            <button
              type="button"
              aria-label="Hapus bagian ini"
              onClick={() => onRemove(item.id)}
              className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <textarea
          ref={textareaRef}
          rows={3}
          aria-label={isFirst ? "Isi aspirasi" : "Lanjutan aspirasi"}
          placeholder={
            isFirst
              ? "Apa yang ingin Anda sampaikan?"
              : "Lanjutkan postingan..."
          }
          value={item.text}
          onChange={(event) => onTextChange(item.id, event.target.value)}
          className="w-full resize-none rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-base leading-relaxed text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-slate-900/50 dark:text-white sm:text-sm"
        />

        {item.image && (
          <div className="relative mt-2 h-40 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <ImageWithFallback
              src={item.image}
              alt="Pratinjau lampiran"
              fill
              unoptimized
              className="object-cover"
            />
            <button
              type="button"
              aria-label="Hapus gambar"
              onClick={() => onImageChange(item.id, null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="-ml-2 mt-1 inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-slate-100 hover:text-green-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-green-400"
        >
          <ImagePlus className="h-[18px] w-[18px]" />
          <span>{item.image ? "Ganti gambar" : "Tambah gambar"}</span>
        </button>
      </div>
    </div>
  );
}
