import api from "./api";

export const bookingService = {
  getAll: (params = {}) => {
    const query = { ...params };
    if (query.date) query.date = query.date.includes("T") ? query.date : `${query.date}T00:00:00`;
    return api.get("/Booking", { params: query });
  },

  getAvailableTimes: (date) =>
    api.get("/Booking/available", {
      params: { date },
      paramsSerializer: (params) =>
        `date=${encodeURIComponent(params.date)}`,
    }),

  create: (data) => api.post("/Booking", data),

  cancel: (id) => api.put(`/Booking/${id}/cancel`),
};
