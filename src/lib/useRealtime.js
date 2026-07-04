import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "./socket";
import { useAuth } from "../store/auth";

// Subscribes to backend Socket.io events and keeps react-query caches fresh.
// Mounted once near the top of the authenticated tree.
export function useRealtime() {
  const qc = useQueryClient();
  const { token } = useAuth();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const refreshBookings = (payload) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      const id = payload?.bookingId || payload?.booking?._id || payload?._id;
      if (id) qc.invalidateQueries({ queryKey: ["booking", String(id)] });
    };
    const refreshNotifications = () => qc.invalidateQueries({ queryKey: ["notifications"] });

    // Booking/job lifecycle — server emits a variety of event names; we
    // refresh on any of them rather than coupling to exact payload shapes.
    const bookingEvents = [
      "booking:updated", "booking:status", "booking:accepted", "booking:assigned",
      "booking:on_way", "booking:started", "booking:completed", "booking:cancelled",
      "job:update", "provider:location",
    ];
    bookingEvents.forEach((ev) => socket.on(ev, refreshBookings));

    const notifEvents = ["notification", "notification:new", "notify"];
    notifEvents.forEach((ev) => socket.on(ev, () => { refreshNotifications(); refreshBookings(); }));

    return () => {
      bookingEvents.forEach((ev) => socket.off(ev, refreshBookings));
      notifEvents.forEach((ev) => socket.off(ev));
    };
  }, [token]);
}
