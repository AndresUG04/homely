import { useState, useEffect } from "react";
import { api } from "../config/api";

export const useNotifications = (token) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const data = await api.get("/api/notifications", token);
    if (!data.error) setNotifications(data);
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`, {}, token);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await api.patch("/api/notifications/read-all", {}, token);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications };
};