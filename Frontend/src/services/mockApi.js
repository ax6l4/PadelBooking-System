import {
  attachCourtName,
  getCourtById,
  loadStore,
  saveStore,
} from "../data/mockStore";
import { formatLocalDate } from "../utils/helpers";

class MockError extends Error {
  constructor(message, status = 400, data = message) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function omitPassword(user) {
  const safe = { ...user };
  delete safe.password;
  return safe;
}

const STATUS_BY_NUM = {
  0: "Pending",
  1: "Confirmed",
  2: "Cancelled",
  3: "Completed",
};

const PAYMENT_METHOD_BY_NUM = {
  0: "PayAtVenue",
  1: "Thawani",
};

function delay(ms = 100) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRoute(config) {
  let url = config.url || "";
  if (url.startsWith("http")) {
    const u = new URL(url);
    url = u.pathname + u.search;
  }
  const path = url
    .replace(/^\/demo-api\/?/, "")
    .replace(/^\/api\/?/, "")
    .replace(/^\//, "")
    .split("?")[0];
  const segments = path.split("/").filter(Boolean);
  return { segments, params: config.params || {} };
}

function timeToHour(time) {
  if (!time) return 0;
  const s = String(time);
  if (s.startsWith("PT")) {
    const m = s.match(/PT(\d+)H/);
    return m ? parseInt(m[1], 10) : 0;
  }
  return parseInt(s.split(":")[0], 10);
}

function hourToTime(h) {
  return `${String(h).padStart(2, "0")}:00:00`;
}

function parseDateOnly(d) {
  if (!d) return null;
  const s = String(d).split("T")[0];
  return s;
}

function getCourtHours(court, dayOfWeek, workingHours) {
  const custom = workingHours.find(
    (w) => w.courtId === court.id && w.dayOfWeek === dayOfWeek
  );
  if (custom) {
    const open = timeToHour(custom.startTime);
    const close = timeToHour(custom.endTime);
    if (close > open) return { open, close };
  }
  return {
    open: timeToHour(court.openingTime),
    close: timeToHour(court.closingTime),
  };
}

function isCourtClosed(courtId, dateStr, startHour, endHour, closures) {
  return closures.some((c) => {
    if (c.courtId !== courtId) return false;
    if (parseDateOnly(c.date) !== dateStr) return false;
    if (!c.startTime && !c.endTime) return true;
    const cStart = timeToHour(c.startTime);
    const cEnd = timeToHour(c.endTime);
    return cStart < endHour && cEnd > startHour;
  });
}

function hasBookingConflict(courtId, dateStr, startHour, endHour, bookings) {
  return bookings.some((b) => {
    if (b.courtId !== courtId) return false;
    if (parseDateOnly(b.bookingDate) !== dateStr) return false;
    if (b.status === "Cancelled") return false;
    const bStart = timeToHour(b.startTime);
    const bEnd = timeToHour(b.endTime);
    return bStart < endHour && bEnd > startHour;
  });
}

function isCourtAvailable(court, dateStr, startHour, endHour, store) {
  if (!court?.isActive) return false;
  const day = new Date(dateStr + "T12:00:00").getDay();
  const { open, close } = getCourtHours(court, day, store.workingHours);
  if (startHour < open || endHour > close) return false;
  if (isCourtClosed(court.id, dateStr, startHour, endHour, store.closures))
    return false;
  if (
    hasBookingConflict(
      court.id,
      dateStr,
      startHour,
      endHour,
      store.bookings
    )
  )
    return false;
  return true;
}

function calculatePrice(court, totalHours, dateStr, offers) {
  const applicable = offers
    .filter(
      (o) =>
        o.courtId === court.id &&
        o.isActive &&
        parseDateOnly(o.startDate) <= dateStr &&
        parseDateOnly(o.endDate) >= dateStr &&
        totalHours >= o.minimumHours
    )
    .sort((a, b) => b.minimumHours - a.minimumHours);
  if (applicable.length) return totalHours * applicable[0].pricePerHour;
  return totalHours * court.pricePerHour;
}

function pickAvailableCourt(dateStr, startHour, endHour, store) {
  const available = store.courts.filter((c) =>
    isCourtAvailable(c, dateStr, startHour, endHour, store)
  );
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function enrichBooking(b, store) {
  return {
    ...b,
    court: b.court || attachCourtName(store, b.courtId),
  };
}

function enrichPayment(p, store) {
  const booking = store.bookings.find((b) => b.id === p.bookingId);
  return {
    ...p,
    booking: booking ? enrichBooking(booking, store) : null,
  };
}

function getAvailableTimes(dateParam, store, hours = 1) {
  const dateStr = parseDateOnly(dateParam);
  const now = new Date();
  const todayStr = formatLocalDate(now);
  const duration = Math.min(6, Math.max(1, parseInt(hours, 10) || 1));

  if (dateStr < todayStr) {
    throw new MockError("لا يمكن الحجز في تاريخ سابق");
  }

  const activeCourts = store.courts.filter((c) => c.isActive);
  if (!activeCourts.length) return [];

  const day = new Date(dateStr + "T12:00:00").getDay();
  let minHour = Math.min(
    ...activeCourts.map((c) => getCourtHours(c, day, store.workingHours).open)
  );
  let maxHour = Math.max(
    ...activeCourts.map((c) => getCourtHours(c, day, store.workingHours).close)
  );
  if (minHour >= maxHour) {
    minHour = Math.min(...activeCourts.map((c) => timeToHour(c.openingTime)));
    maxHour = Math.max(...activeCourts.map((c) => timeToHour(c.closingTime)));
  }

  const slots = [];
  for (let hour = minHour; hour < maxHour; hour++) {
    const startTime = hourToTime(hour);
    const endTime = hourToTime(hour + 1);

    if (dateStr === todayStr) {
      const slotStart = hour * 60;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotStart <= nowMinutes) {
        slots.push({ startTime, endTime, available: false });
        continue;
      }
    }

    if (hour + duration > maxHour) {
      slots.push({ startTime, endTime, available: false });
      continue;
    }

    // يظهر الوقت فقط إذا وُجد ملعب واحد يغطي كامل مدة الحجز
    const available = activeCourts.some((c) =>
      isCourtAvailable(c, dateStr, hour, hour + duration, store)
    );
    slots.push({ startTime, endTime, available });
  }
  return slots;
}

function filterBookings(store, params) {
  let list = store.bookings.map((b) => enrichBooking(b, store));

  if (params.date) {
    const d = parseDateOnly(params.date);
    list = list.filter((b) => parseDateOnly(b.bookingDate) === d);
  }
  if (params.phone) {
    list = list.filter((b) => b.phone?.includes(params.phone));
  }
  if (params.status !== undefined && params.status !== "") {
    const status =
      typeof params.status === "number"
        ? STATUS_BY_NUM[params.status]
        : STATUS_BY_NUM[parseInt(params.status, 10)] || params.status;
    list = list.filter((b) => b.status === status);
  }
  if (params.courtId) {
    list = list.filter((b) => b.courtId === parseInt(params.courtId, 10));
  }
  if (params.paymentMethod !== undefined && params.paymentMethod !== "") {
    const pm =
      PAYMENT_METHOD_BY_NUM[parseInt(params.paymentMethod, 10)] ||
      params.paymentMethod;
    list = list.filter((b) => b.paymentMethod === pm);
  }

  return list.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export async function mockRequest(config) {
  await delay(120);
  const store = loadStore();
  const method = (config.method || "get").toLowerCase();
  const { segments, params } = parseRoute(config);
  const data = config.data ? JSON.parse(config.data) : null;
  const [resource, idOrAction, action] = segments;

  // --- Court ---
  if (resource === "Court") {
    if (method === "get" && !idOrAction) {
      return { data: store.courts };
    }
    if (method === "get" && idOrAction) {
      const court = getCourtById(store, parseInt(idOrAction, 10));
      if (!court) throw new MockError("الملعب غير موجود", 404);
      return { data: court };
    }
    if (method === "post") {
      const id = store.nextId.court++;
      const court = { id, ...data, isActive: data.isActive !== false };
      store.courts.push(court);
      saveStore(store);
      return { data: court };
    }
    if (method === "put" && idOrAction) {
      const idx = store.courts.findIndex((c) => c.id === parseInt(idOrAction, 10));
      if (idx === -1) throw new MockError("الملعب غير موجود", 404);
      store.courts[idx] = { ...store.courts[idx], ...data, id: store.courts[idx].id };
      saveStore(store);
      return { data: store.courts[idx] };
    }
    if (method === "delete" && idOrAction) {
      const courtId = parseInt(idOrAction, 10);
      const hasBookings = store.bookings.some(
        (b) => b.courtId === courtId && b.status !== "Cancelled"
      );
      if (hasBookings) {
        throw new MockError("لا يمكن حذف الملعب — يوجد حجوزات مرتبطة به");
      }
      store.courts = store.courts.filter((c) => c.id !== courtId);
      saveStore(store);
      return { data: "تم الحذف" };
    }
  }

  // --- Booking ---
  if (resource === "Booking") {
    if (method === "get" && idOrAction === "available") {
      const date = params.date;
      const hours = params.hours || 1;
      return { data: getAvailableTimes(date, store, hours) };
    }
    if (method === "get") {
      return { data: filterBookings(store, params) };
    }
    if (method === "post") {
      if (!data?.phone?.trim()) throw new MockError("رقم الهاتف مطلوب");

      const startDate = parseDateOnly(data.bookingDate);
      const endDate = parseDateOnly(data.endDate || data.bookingDate);
      if (endDate < startDate)
        throw new MockError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

      const startHour = timeToHour(data.startTime);
      const endHour = timeToHour(data.endTime);
      const totalHours = endHour - startHour;
      if (totalHours <= 0) throw new MockError("وقت الحجز غير صحيح");

      const activeCourts = store.courts.filter((c) => c.isActive);
      if (!activeCourts.length) throw new MockError("لا توجد ملاعب متاحة");

      const todayStr = formatLocalDate(new Date());
      const now = new Date();

      const saved = [];
      let totalPrice = 0;
      let current = new Date(startDate + "T12:00:00");

      while (formatLocalDate(current) <= endDate) {
        const dayStr = formatLocalDate(current);

        if (dayStr < todayStr) {
          throw new MockError("لا يمكن الحجز في تاريخ سابق");
        }
        if (dayStr === todayStr) {
          const startMinutes = startHour * 60;
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          if (startMinutes <= nowMinutes) {
            throw new MockError("لا يمكن حجز وقت مضى");
          }
        }

        const court = pickAvailableCourt(dayStr, startHour, endHour, store);
        if (!court) {
          throw new MockError(
            `لا يوجد ملعب متاح في ${dayStr} للوقت المحدد`
          );
        }

        if (
          !isCourtAvailable(court, dayStr, startHour, endHour, store)
        ) {
          throw new MockError(
            `الوقت المحدد لم يعد متاحاً في ${dayStr}`
          );
        }
        const price = calculatePrice(court, totalHours, dayStr, store.offers);
        const bookingId = store.nextId.booking++;
        const booking = {
          id: bookingId,
          phone: data.phone.trim(),
          customerName: data.customerName || null,
          customerEmail: data.customerEmail || null,
          courtId: court.id,
          court: attachCourtName(store, court.id),
          bookingDate: `${dayStr}T00:00:00`,
          startTime: data.startTime,
          endTime: data.endTime,
          totalHours,
          totalPrice: price,
          status: "Pending",
          paymentMethod: data.paymentMethod || "PayAtVenue",
          createdAt: new Date().toISOString(),
        };
        store.bookings.push(booking);
        saved.push(booking);
        totalPrice += price;
        current.setDate(current.getDate() + 1);
      }
      saveStore(store);

      return {
        data: {
          message: "تم إنشاء الحجز بنجاح",
          bookingId: saved[0].id,
          bookingIds: saved.map((b) => b.id),
          bookingDate: data.bookingDate,
          endDate: data.endDate || data.bookingDate,
          startTime: data.startTime,
          endTime: data.endTime,
          totalHours,
          totalPrice,
          daysCount: saved.length,
        },
      };
    }
    if (method === "put" && action === "cancel") {
      const booking = store.bookings.find((b) => b.id === parseInt(idOrAction, 10));
      if (!booking) throw new MockError("الحجز غير موجود", 404);
      booking.status = "Cancelled";
      saveStore(store);
      return { data: "تم إلغاء الحجز" };
    }
  }

  // --- Payment ---
  if (resource === "Payment") {
    if (method === "get") {
      const payments = store.payments
        .map((p) => enrichPayment(p, store))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { data: payments };
    }
    if (method === "post") {
      const booking = store.bookings.find((b) => b.id === data.bookingId);
      if (!booking) throw new MockError("الحجز غير موجود");

      booking.paymentMethod = data.paymentMethod;
      const paymentId = store.nextId.payment++;
      const amount = data.amount ?? booking.totalPrice;

      if (data.paymentMethod === "PayAtVenue") {
        const idsToConfirm =
          data.bookingIds?.length > 0 ? data.bookingIds : [data.bookingId];
        idsToConfirm.forEach((bid) => {
          const b = store.bookings.find((x) => x.id === bid);
          if (b) b.status = "Confirmed";
        });

        const payment = {
          id: paymentId,
          bookingId: booking.id,
          bookingIds: data.bookingIds?.length ? data.bookingIds : [data.bookingId],
          amount,
          paymentMethod: "PayAtVenue",
          status: "Pending",
          transactionId: null,
          createdAt: new Date().toISOString(),
        };
        store.payments.push(payment);
        saveStore(store);
        return {
          data: {
            message: "تم تأكيد الحجز — الدفع عند الوصول",
            paymentId,
            amount,
            status: "Pending",
            bookingConfirmed: true,
          },
        };
      }

      if (data.paymentMethod === "Thawani") {
        const payment = {
          id: paymentId,
          bookingId: booking.id,
          bookingIds: data.bookingIds?.length ? data.bookingIds : [data.bookingId],
          amount,
          paymentMethod: "Thawani",
          status: "Pending",
          sessionId: `demo-session-${paymentId}`,
          checkoutUrl: `/payment/thawani-demo?paymentId=${paymentId}&amount=${amount}&session=demo-session-${paymentId}`,
          transactionId: null,
          createdAt: new Date().toISOString(),
        };
        store.payments.push(payment);
        saveStore(store);
        return {
          data: {
            message: "تم إنشاء رابط الدفع عبر Thawani",
            paymentId,
            sessionId: payment.sessionId,
            checkoutUrl: payment.checkoutUrl,
            amount,
            sandbox: true,
          },
        };
      }

      throw new MockError("طريقة الدفع غير صحيحة");
    }
    if (method === "put" && idOrAction === "confirm") {
      const paymentId = parseInt(action, 10);
      const payment = store.payments.find((p) => p.id === paymentId);
      if (!payment) throw new MockError("الدفع غير موجود", 404);

      payment.status = "Paid";
      payment.transactionId = `demo-tx-${Date.now()}`;

      const bookingIdsParam = params.bookingIds;
      const ids = bookingIdsParam
        ? String(bookingIdsParam)
            .split(",")
            .map((x) => parseInt(x.trim(), 10))
            .filter((x) => !Number.isNaN(x))
        : payment.bookingIds?.length
          ? payment.bookingIds
          : [payment.bookingId];

      ids.forEach((bid) => {
        const b = store.bookings.find((x) => x.id === bid);
        if (b) b.status = "Confirmed";
      });

      saveStore(store);
      return {
        data: {
          message: "تم الدفع وتأكيد الحجز",
          paymentId,
          transactionId: payment.transactionId,
        },
      };
    }
    if (method === "put" && idOrAction === "fail") {
      const payment = store.payments.find(
        (p) => p.id === parseInt(action, 10)
      );
      if (!payment) throw new MockError("الدفع غير موجود", 404);
      payment.status = "Failed";
      saveStore(store);
      return { data: "تم تسجيل فشل الدفع" };
    }
  }

  // --- User ---
  if (resource === "User") {
    if (method === "post" && idOrAction === "register") {
      if (store.users.some((u) => u.email === data.email)) {
        throw new MockError("البريد مستخدم مسبقاً");
      }
      const id = store.nextId.user++;
      const user = {
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "Customer",
      };
      store.users.push(user);
      saveStore(store);
      return { data: omitPassword(user) };
    }
    if (method === "post" && idOrAction === "login") {
      const user = store.users.find(
        (u) => u.email === data.email && u.password === data.password
      );
      if (!user) {
        throw new MockError("البريد أو كلمة المرور غير صحيحة", 401);
      }
      return { data: omitPassword(user) };
    }
    if (method === "get") {
      const users = store.users.map(omitPassword);
      return { data: users };
    }
  }

  // --- Offer ---
  if (resource === "Offer") {
    if (method === "get" && !idOrAction) {
      const offers = store.offers.map((o) => ({
        ...o,
        court: o.court || attachCourtName(store, o.courtId),
      }));
      return { data: offers };
    }
    if (method === "get" && idOrAction) {
      const offer = store.offers.find((o) => o.id === parseInt(idOrAction, 10));
      if (!offer) throw new MockError("العرض غير موجود", 404);
      return { data: offer };
    }
    if (method === "post") {
      const id = store.nextId.offer++;
      const offer = {
        id,
        ...data,
        court: attachCourtName(store, data.courtId),
        isActive: data.isActive !== false,
      };
      store.offers.push(offer);
      saveStore(store);
      return { data: offer };
    }
    if (method === "put" && idOrAction) {
      const idx = store.offers.findIndex((o) => o.id === parseInt(idOrAction, 10));
      if (idx === -1) throw new MockError("العرض غير موجود", 404);
      store.offers[idx] = {
        ...store.offers[idx],
        ...data,
        id: store.offers[idx].id,
        court: attachCourtName(store, data.courtId || store.offers[idx].courtId),
      };
      saveStore(store);
      return { data: store.offers[idx] };
    }
    if (method === "delete" && idOrAction) {
      store.offers = store.offers.filter((o) => o.id !== parseInt(idOrAction, 10));
      saveStore(store);
      return { data: "تم الحذف" };
    }
  }

  // --- CourtClosure ---
  if (resource === "CourtClosure") {
    if (method === "get") {
      const closures = store.closures.map((c) => ({
        ...c,
        court: c.court || attachCourtName(store, c.courtId),
      }));
      return { data: closures };
    }
    if (method === "post" && idOrAction === "bulk") {
      const ids = !data.courtIds
        ? store.courts.map((c) => c.id)
        : Array.isArray(data.courtIds)
          ? data.courtIds
          : [data.courtIds];

      const startStr = parseDateOnly(data.startDate);
      const endStr = parseDateOnly(data.endDate || data.startDate);
      const weekdays = data.weekdays?.length ? data.weekdays.map(Number) : null;
      const created = [];

      let current = new Date(startStr + "T12:00:00");
      const endDate = new Date(endStr + "T12:00:00");

      while (current <= endDate) {
        const dayStr = formatLocalDate(current);
        const dow = current.getDay();
        if (!weekdays || weekdays.includes(dow)) {
          ids.forEach((courtId) => {
            const id = store.nextId.closure++;
            const closure = {
              id,
              courtId,
              court: attachCourtName(store, courtId),
              date: `${dayStr}T00:00:00`,
              startTime: data.startTime || null,
              endTime: data.endTime || null,
              reason: data.reason || "",
            };
            store.closures.push(closure);
            created.push(closure);
          });
        }
        current.setDate(current.getDate() + 1);
      }
      saveStore(store);
      return { data: created };
    }
    if (method === "post") {
      const id = store.nextId.closure++;
      const closure = {
        id,
        ...data,
        court: attachCourtName(store, data.courtId),
      };
      store.closures.push(closure);
      saveStore(store);
      return { data: closure };
    }
    if (method === "delete" && idOrAction) {
      store.closures = store.closures.filter(
        (c) => c.id !== parseInt(idOrAction, 10)
      );
      saveStore(store);
      return { data: "تم الحذف" };
    }
  }

  // --- CourtWorkingHour ---
  if (resource === "CourtWorkingHour") {
    if (method === "get") {
      const items = store.workingHours.map((w) => ({
        ...w,
        court: w.court || attachCourtName(store, w.courtId),
      }));
      return { data: items };
    }
    if (method === "post") {
      const id = store.nextId.workingHour++;
      const wh = {
        id,
        ...data,
        court: attachCourtName(store, data.courtId),
      };
      store.workingHours.push(wh);
      saveStore(store);
      return { data: wh };
    }
    if (method === "put" && idOrAction) {
      const idx = store.workingHours.findIndex(
        (w) => w.id === parseInt(idOrAction, 10)
      );
      if (idx === -1) throw new MockError("غير موجود", 404);
      store.workingHours[idx] = {
        ...store.workingHours[idx],
        ...data,
        id: store.workingHours[idx].id,
      };
      saveStore(store);
      return { data: store.workingHours[idx] };
    }
    if (method === "delete" && idOrAction) {
      store.workingHours = store.workingHours.filter(
        (w) => w.id !== parseInt(idOrAction, 10)
      );
      saveStore(store);
      return { data: "تم الحذف" };
    }
  }

  throw new MockError(`Mock route not found: ${method} ${segments.join("/")}`, 404);
}
