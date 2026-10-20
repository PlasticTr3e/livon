import { z } from "zod";

export const threadItemSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Thread item text cannot be empty")
    .max(5000, "Thread item text cannot exceed 5000 characters"),
  imageUrl: z.string().url("Invalid image URL format").nullable().optional(),
});

export const createPostSchema = z
  .object({
    content: z
      .string()
      .trim()
      .max(10000, "Post content cannot exceed 10000 characters")
      .optional(),
    images: z
      .array(z.string().url("Invalid image URL format"))
      .max(5, "Maximum 5 images allowed per post")
      .optional()
      .default([]),
    threadItems: z
      .array(threadItemSchema)
      .max(5, "Maximum 5 thread items allowed per post")
      .optional(),
  })
  .refine(
    (data) => {
      const hasDirectContent = Boolean(data.content?.trim());
      const hasThreadContent = Boolean(
        data.threadItems &&
        data.threadItems.length > 0 &&
        data.threadItems[0]?.text.trim(),
      );
      return hasDirectContent || hasThreadContent;
    },
    {
      message: "Post must have content or at least one thread item",
      path: ["content"],
    },
  )
  .refine(
    (data) => {
      const directImagesCount = data.images?.length || 0;
      const threadImagesCount =
        data.threadItems?.filter((item) => Boolean(item.imageUrl)).length || 0;
      return Math.max(directImagesCount, threadImagesCount) <= 5;
    },
    {
      message: "Total images cannot exceed 5 per post",
      path: ["images"],
    },
  );

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment content cannot exceed 2000 characters"),
  parentId: z
    .string()
    .uuid("Invalid parent comment ID format")
    .optional()
    .nullable(),
});

export const postQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type PostQueryInput = z.infer<typeof postQuerySchema>;
export type ThreadItemInput = z.infer<typeof threadItemSchema>;
