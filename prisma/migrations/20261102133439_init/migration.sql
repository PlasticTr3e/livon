-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_thread_items" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_thread_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "community_posts_user_id_idx" ON "community_posts"("user_id");

-- CreateIndex
CREATE INDEX "community_thread_items_post_id_order_idx" ON "community_thread_items"("post_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_likes_post_id_user_id_key" ON "community_post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "community_comments_post_id_created_at_idx" ON "community_comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "community_comments_parent_id_idx" ON "community_comments"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_comment_likes_comment_id_user_id_key" ON "community_comment_likes"("comment_id", "user_id");

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_thread_items" ADD CONSTRAINT "community_thread_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_likes" ADD CONSTRAINT "community_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comment_likes" ADD CONSTRAINT "community_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comment_likes" ADD CONSTRAINT "community_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
