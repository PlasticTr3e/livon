"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, cn } from "@/components/ui/primitives";
import {
  MAX_COMMUNITY_DRAFT_ITEMS,
  createCommunityId,
  hasCommunityDraftContent,
  revokeCommunityDraftImage,
} from "@/lib/community/community-feed";
import type {
  CommunityAuthor,
  CommunityDraftItem,
} from "@/lib/community/community-types";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityComposerThreadItem } from "./CommunityComposerThreadItem";
import styles from "./community.module.css";

type CommunityComposerDialogProps = {
  author: CommunityAuthor;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (items: CommunityDraftItem[]) => void;
};

const EMPTY_DRAFT: CommunityDraftItem[] = [
  { id: "draft-root", text: "", image: null },
];

export function CommunityComposerDialog({
  author,
  isOpen,
  onOpenChange,
  onSubmit,
}: CommunityComposerDialogProps) {
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [items, setItems] = useState<CommunityDraftItem[]>(EMPTY_DRAFT);

  const lastItem = items[items.length - 1];
  const canSubmit = hasCommunityDraftContent(items);
  const canAddItem =
    items.length < MAX_COMMUNITY_DRAFT_ITEMS &&
    Boolean(lastItem.text.trim() || lastItem.image);

  function handleOpenChange(nextIsOpen: boolean) {
    if (!nextIsOpen) {
      items.forEach((item) => revokeCommunityDraftImage(item.image));
      setItems(EMPTY_DRAFT);
    }
    onOpenChange(nextIsOpen);
  }

  function handleSubmit() {
    if (!canSubmit) return;

    // Attached images stay alive: the published post keeps using their URLs.
    onSubmit(items);
    setItems(EMPTY_DRAFT);
    onOpenChange(false);
  }

  function handleTextChange(itemId: string, text: string) {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, text } : item)),
    );
  }

  function handleImageChange(itemId: string, image: string | null) {
    revokeItemImage(itemId);
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, image } : item)),
    );
  }

  function handleRemoveItem(itemId: string) {
    revokeItemImage(itemId);
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function revokeItemImage(itemId: string) {
    const previousImage = items.find((item) => item.id === itemId)?.image;
    revokeCommunityDraftImage(previousImage ?? null);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[2147483646] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4",
            styles.overlay,
          )}
        >
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              firstTextareaRef.current?.focus();
            }}
            className={cn(
              "flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none dark:bg-[#111827] sm:max-h-[85dvh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-gray-100 sm:dark:border-gray-800",
              styles.sheet,
            )}
          >
            <div
              aria-hidden
              className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 sm:hidden"
            />

            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
              <Dialog.Close className="-ml-2 justify-self-start rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Batal
              </Dialog.Close>
              <Dialog.Title className="text-sm font-black text-gray-900 dark:text-white">
                Aspirasi baru
              </Dialog.Title>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="justify-self-end rounded-full px-5 py-1.5 text-sm font-bold disabled:cursor-not-allowed"
              >
                Kirim
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              {items.map((item, index) => (
                <CommunityComposerThreadItem
                  key={item.id}
                  author={author}
                  isFirst={index === 0}
                  item={item}
                  textareaRef={index === 0 ? firstTextareaRef : undefined}
                  onImageChange={handleImageChange}
                  onRemove={index > 0 ? handleRemoveItem : undefined}
                  onTextChange={handleTextChange}
                />
              ))}

              {items.length < MAX_COMMUNITY_DRAFT_ITEMS && (
                <button
                  type="button"
                  disabled={!canAddItem}
                  onClick={() =>
                    setItems((current) => [
                      ...current,
                      { id: createCommunityId(), text: "", image: null },
                    ])
                  }
                  className="group flex w-full items-center gap-3 rounded-lg py-1 text-left text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-white"
                >
                  <span className="flex w-10 shrink-0 justify-center">
                    <CommunityAvatar
                      author={author}
                      size="xs"
                      className="opacity-60 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                  Tambah ke postingan
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
