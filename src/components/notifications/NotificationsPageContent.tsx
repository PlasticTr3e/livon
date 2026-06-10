"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchUserNotifications,
  getStoredNotificationToken,
  markNotificationAsRead,
} from "@/lib/notifications/notification-api";
import { getUnreadNotificationsCount } from "@/lib/notifications/notification-format";
import type {
  NotificationFilter,
  NotificationItem,
} from "@/lib/notifications/notification-types";
import { NotificationFilterBar } from "./NotificationFilterBar";
import { NotificationsHeader } from "./NotificationsHeader";
import { NotificationsList } from "./NotificationsList";

export function NotificationsPageContent() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setIsLoading(true);
        const nextNotifications = await fetchUserNotifications(
          getStoredNotificationToken(),
        );
        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = getUnreadNotificationsCount(notifications);
  const filteredNotifications = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((notification) => !notification.read),
    [filter, notifications],
  );

  async function handleMarkAsRead(notificationId: string) {
    const previousNotifications = notifications;

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );

    try {
      await markNotificationAsRead(
        notificationId,
        getStoredNotificationToken(),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
      setNotifications(previousNotifications);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6 dark:bg-[#0B1120]">
      <div className="mx-auto max-w-4xl">
        <NotificationsHeader />
        <NotificationFilterBar
          activeFilter={filter}
          notificationsCount={notifications.length}
          unreadCount={unreadCount}
          onFilterChange={setFilter}
        />
        <NotificationsList
          filter={filter}
          isLoading={isLoading}
          notifications={filteredNotifications}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>
    </div>
  );
}
