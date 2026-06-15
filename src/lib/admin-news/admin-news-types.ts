export type AdminNewsItem = {
  id: string;
  title: string;
  content: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  createdById: string;
  author?: {
    agencyProfile?: {
      agencyName?: string;
    };
  };
};

export type AdminNewsWithExtras = AdminNewsItem & {
  isHeadline?: boolean;
};

export type AdminNewsFormValues = {
  title: string;
  content: string;
  thumbnailUrl: string;
};
