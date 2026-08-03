import api from "./api";

export const bookingService = {
  getAll: (params = {}) => {
    const query = { ...params };
    if (query.date) query.date = query.date.includes("T") ? query.date : `${query.date}T00:00:00`;
    return api.get("/Booking", { params: query });
  },

  getAvailableTimes: (date, hours = 1) =>
    api.get("/Booking/available", {
      params: { date, hours },
    }),

  create: (data) => api.post("/Booking", data),

  cancel: (id) => api.put(`/Booking/${id}/cancel`),
};
