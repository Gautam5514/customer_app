import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "../store/auth";

// ─── Services ────────────────────────────────────────────────────────────────
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get("/services")).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useService(slug) {
  return useQuery({
    enabled: !!slug,
    queryKey: ["service", slug],
    queryFn: async () => (await api.get(`/services/${slug}`)).data,
  });
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["bookings"],
    queryFn: async () => (await api.get("/bookings/my")).data,
  });
}

export function useBooking(id) {
  return useQuery({
    enabled: !!id,
    queryKey: ["booking", id],
    queryFn: async () => (await api.get(`/bookings/${id}`)).data,
    refetchInterval: 15000, // gentle poll as a safety net alongside sockets
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/bookings", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) =>
      (await api.put(`/bookings/${id}/cancel`, { reason })).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", vars.id] });
    },
  });
}

// ─── Addresses ───────────────────────────────────────────────────────────────
export function useAddresses() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["addresses"],
    queryFn: async () => (await api.get("/addresses")).data,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/addresses", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.put(`/addresses/${id}/default`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/addresses/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user,
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.put("/notifications/read-all")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.put(`/notifications/${id}/read`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ─── Ratings ─────────────────────────────────────────────────────────────────
export function useSubmitRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/ratings", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
