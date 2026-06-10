import { useState, useEffect, useCallback } from "react";
import { api } from "../config/api";

export const useNotifications = (token) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    const data = await api.get("/api/notifications", token);
    if (!data.error) setNotifications(data);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]); // ← solo fetchNotifications, no token

  const markAsRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`, {}, token);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await api.patch("/api/notifications/read-all", {}, token);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications };
};