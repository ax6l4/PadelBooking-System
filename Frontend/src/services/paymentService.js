import api from "./api";

export const paymentService = {
  getAll: () => api.get("/Payment"),

  create: (data) => api.post("/Payment", data),

  confirm: (id, bookingIds) =>
    api.put(`/Payment/confirm/${id}`, null, {
      params: bookingIds ? { bookingIds: bookingIds.join(",") } : {},
    }),

  fail: (id) => api.put(`/Payment/fail/${id}`),
};
