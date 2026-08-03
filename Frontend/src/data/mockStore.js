import { DEMO_STORAGE_KEY } from "../config/demo";

/** بيانات تجريبية — سعر الساعة 10 ر.ع، وعرض 8 ر.ع عند حجز ساعتين فأكثر */
const DEFAULT_STORE = {
  courts: [
    { id: 1, name: "ملعب 1", description: "ملعب بادل داخلي مكيف", pricePerHour: 10, openingTime: "08:00:00", closingTime: "23:00:00", isActive: true },
    { id: 2, name: "ملعب 2", description: "ملعب بادل خارجي", pricePerHour: 10, openingTime: "08:00:00", closingTime: "23:00:00", isActive: true },
    { id: 3, name: "ملعب VIP", description: "ملعب فاخر مع tribune", pricePerHour: 10, openingTime: "09:00:00", closingTime: "22:00:00", isActive: true },
  ],
  bookings: [
    { id: 1, phone: "0512345678", customerName: "أحمد", customerEmail: null, courtId: 1, court: { id: 1, name: "ملعب 1" }, bookingDate: "2026-08-05T00:00:00", startTime: "10:00:00", endTime: "11:00:00", totalHours: 1, totalPrice: 10, status: "Confirmed", paymentMethod: "PayAtVenue", createdAt: "2026-08-01T10:00:00Z" },
    { id: 2, phone: "0598765432", customerName: "سارة", customerEmail: "sara@email.com", courtId: 2, court: { id: 2, name: "ملعب 2" }, bookingDate: "2026-08-06T00:00:00", startTime: "14:00:00", endTime: "16:00:00", totalHours: 2, totalPrice: 16, status: "Pending", paymentMethod: "Thawani", createdAt: "2026-08-02T12:00:00Z" },
  ],
  offers: [
    { id: 1, courtId: 1, court: { id: 1, name: "ملعب 1" }, minimumHours: 2, pricePerHour: 8, startDate: "2026-01-01T00:00:00", endDate: "2027-12-31T00:00:00", isActive: true },
    { id: 2, courtId: 2, court: { id: 2, name: "ملعب 2" }, minimumHours: 2, pricePerHour: 8, startDate: "2026-01-01T00:00:00", endDate: "2027-12-31T00:00:00", isActive: true },
    { id: 3, courtId: 3, court: { id: 3, name: "ملعب VIP" }, minimumHours: 2, pricePerHour: 8, startDate: "2026-01-01T00:00:00", endDate: "2027-12-31T00:00:00", isActive: true },
  ],
  closures: [
    { id: 1, courtId: 1, court: { id: 1, name: "ملعب 1" }, date: "2026-08-15T00:00:00", startTime: null, endTime: null, reason: "صيانة دورية" },
  ],
  workingHours: [
    { id: 1, courtId: 3, court: { id: 3, name: "ملعب VIP" }, dayOfWeek: 5, startTime: "14:00:00", endTime: "22:00:00" },
  ],
  payments: [
    { id: 1, bookingId: 1, amount: 10, paymentMethod: "PayAtVenue", status: "Paid", transactionId: "demo-tx-001", createdAt: "2026-08-01T10:05:00Z", booking: null },
  ],
  users: [
    { id: 1, name: "مدير النظام", email: "admin@padel.com", phone: "0500000000", password: "admin123", role: "Admin" },
    { id: 2, name: "عميل تجريبي", email: "customer@padel.com", phone: "0512345678", password: "123456", role: "Customer" },
  ],
  nextId: { court: 4, booking: 3, offer: 4, closure: 2, workingHour: 2, payment: 2, user: 3 },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return clone(DEFAULT_STORE);
}

export function saveStore(store) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
}

export function resetStore() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  return clone(DEFAULT_STORE);
}

export function getCourtById(store, id) {
  return store.courts.find((c) => c.id === id);
}

export function attachCourtName(store, courtId) {
  const c = getCourtById(store, courtId);
  return c ? { id: c.id, name: c.name } : { id: courtId, name: `ملعب #${courtId}` };
}
