export type NotificationFilter = "all" | "unread";

export type DatabaseNotification = {
  id: string;
  userId: string;
  projectId?: string;
  referenceId?: string;
  title?: string;
  type?: string;
  message?: string;
  isRead: boolean;
  createdAt: string | Date;
};

export type NotificationCategory =
  | "funding"
  | "project"
  | "comment"
  | "system"
  | "news"
  | "registration";

export type NotificationItem = {
  id: string;
  title: string;
  desc: string;
  time: string;
  category: NotificationCategory;
  read: boolean;
  dot: string;
};
