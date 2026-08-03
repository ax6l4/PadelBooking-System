import { isDemoMode } from "../config/demo";

export * from "./constants";

export function isAdmin(user) {
  if (!user) return false;
  return user.role === "Admin" || user.role === 1;
}

export function getErrorMessage(error, fallback = "حدث خطأ") {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat();
    if (messages.length) return messages.join(" — ");
  }
  if (Array.isArray(data?.errors)) return data.errors.join(" ");
  if (!error?.response) {
    return isDemoMode
      ? "حدث خطأ — يرجى المحاولة مرة أخرى"
      : "تعذر الاتصال بالخادم";
  }
  return fallback;
}

export function normalizeTime(time) {
  if (time == null || time === "") return "";

  if (typeof time === "string") {
    if (time.startsWith("PT")) {
      const match = time.match(/PT(\d+)H(?:(\d+)M)?/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2] || "0", 10);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      }
    }

    const parts = time.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (Number.isNaN(h)) return time;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  }

  if (typeof time === "object" && time.hours != null) {
    return `${String(time.hours).padStart(2, "0")}:${String(time.minutes || 0).padStart(2, "0")}:00`;
  }

  return String(time);
}

export function normalizeSlots(slots) {
  if (!Array.isArray(slots)) return [];

  return slots.map((slot) => ({
    startTime: normalizeTime(slot.startTime ?? slot.StartTime),
    endTime: normalizeTime(slot.endTime ?? slot.EndTime),
    available: slot.available === true || slot.available === "true" || slot.Available === true,
  }));
}

export function formatTimeDisplay(timeStr) {
  const normalized = normalizeTime(timeStr);
  if (!normalized) return "";
  const parts = normalized.split(":");
  return `${parts[0]}:${parts[1]}`;
}

export function addHoursToTime(startTime, hours) {
  const normalized = normalizeTime(startTime);
  const parts = normalized.split(":");
  const h = parseInt(parts[0], 10) + hours;
  const m = parseInt(parts[1] || "0", 10);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function getHourFromTime(timeStr) {
  const normalized = normalizeTime(timeStr);
  if (!normalized) return -1;
  return parseInt(normalized.split(":")[0], 10);
}

export function getAvailableStartTimes(slots, numHours = 1) {
  return getSelectableStartTimes(slots, numHours).filter((s) => s.available);
}

/** كل أوقات البداية مع حالة التوفر (لعرض «متاح / غير متاح») */
export function getSelectableStartTimes(slots, numHours = 1) {
  const normalizedSlots = normalizeSlots(slots);
  if (!normalizedSlots.length || numHours < 1) return [];
  return normalizedSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    available: !!slot.available,
  }));
}

export function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayLocal() {
  return formatLocalDate(new Date());
}

export function getDateRange(startDateStr, endDateStr) {
  if (!startDateStr) return [];
  const dates = [];
  const start = new Date(`${startDateStr}T12:00:00`);
  const end = new Date(`${endDateStr || startDateStr}T12:00:00`);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(formatLocalDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function intersectMultiDayStartTimes(slotsByDay, numHours) {
  if (!slotsByDay.length) return [];
  let result = getAvailableStartTimes(slotsByDay[0], numHours);
  for (let i = 1; i < slotsByDay.length; i++) {
    const dayStarts = getAvailableStartTimes(slotsByDay[i], numHours);
    const dayStartSet = new Set(dayStarts.map((s) => s.startTime));
    result = result.filter((s) => dayStartSet.has(s.startTime));
  }
  return result;
}

export function toApiDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00`;
}

export function prepareCourtPayload(court) {
  return {
    name: court.name?.trim(),
    description: court.description?.trim() || "",
    pricePerHour: Number(court.pricePerHour),
    openingTime: normalizeTime(court.openingTime) || "08:00:00",
    closingTime: normalizeTime(court.closingTime) || "23:00:00",
    isActive: court.isActive !== false,
  };
}

export function prepareOfferPayload(offer) {
  return {
    courtId: Number(offer.courtId),
    minimumHours: Number(offer.minimumHours),
    pricePerHour: Number(offer.pricePerHour),
    startDate: toApiDate(offer.startDate),
    endDate: toApiDate(offer.endDate),
    isActive: offer.isActive !== false,
  };
}

export function formatBookingDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString().split("T")[0];
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-OM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
