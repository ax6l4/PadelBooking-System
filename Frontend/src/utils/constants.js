/** حالات وطرق الدفع والحجز — تسميات عربية للعرض */

export const PaymentMethod = {
  PayAtVenue: 0,
  Thawani: 1,
};

export const BookingStatus = {
  Pending: 0,
  Confirmed: 1,
  Cancelled: 2,
  Completed: 3,
};

export const bookingStatusLabel = {
  0: "قيد الانتظار",
  1: "مؤكد",
  2: "ملغي",
  3: "مكتمل",
  Pending: "قيد الانتظار",
  Confirmed: "مؤكد",
  Cancelled: "ملغي",
  Completed: "مكتمل",
};

export const paymentMethodLabel = {
  0: "الدفع عند الوصول",
  1: "Thawani",
  PayAtVenue: "الدفع عند الوصول",
  Thawani: "Thawani",
};

export const paymentStatusLabel = {
  0: "قيد الانتظار",
  1: "مدفوع",
  2: "فشل",
  Pending: "قيد الانتظار",
  Paid: "مدفوع",
  Failed: "فشل",
};
