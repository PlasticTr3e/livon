import type { Ref } from "react";
import { Send, X } from "lucide-react";
import type {
  CommunityAuthor,
  CommunityReplyTarget,
} from "@/lib/community/community-types";
import { CommunityAvatar } from "./CommunityAvatar";

type CommunityCommentComposerProps = {
  currentUser: CommunityAuthor;
  inputRef: Ref<HTMLInputElement>;
  replyTarget: CommunityReplyTarget | null;
  value: string;
  onCancelReply: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommunityCommentComposer({
  currentUser,
  inputRef,
  replyTarget,
  value,
  onCancelReply,
  onChange,
  onSubmit,
}: CommunityCommentComposerProps) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-[#111827]/95">
      <div className="mx-auto w-full max-w-2xl px-4 py-2.5">
        {replyTarget && (
          <div className="mb-2 flex items-center justify-between gap-2 pl-11 text-xs text-gray-500 dark:text-gray-400">
            <p className="truncate">
              Membalas{" "}
              <span className="font-semibold text-gray-800 dark:text-white">
                {replyTarget.authorName}
              </span>
            </p>
            <button
              type="button"
              aria-label="Batal membalas"
              onClick={onCancelReply}
              className="-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-gray-800 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex items-center gap-3"
        >
          <CommunityAvatar author={currentUser} size="sm" />
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            aria-label={replyTarget ? "Tulis balasan" : "Tulis komentar"}
            placeholder={
              replyTarget ? "Tulis balasan..." : "Tambahkan komentar..."
            }
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-full border border-transparent bg-slate-100 px-4 text-base text-gray-900 transition-all placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900 sm:text-sm"
          />
          <button
            type="submit"
            aria-label="Kirim"
            disabled={!value.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition duration-150 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-95 disabled:bg-slate-200 disabled:text-gray-400 disabled:active:scale-100 dark:disabled:bg-slate-800 dark:disabled:text-gray-600"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
