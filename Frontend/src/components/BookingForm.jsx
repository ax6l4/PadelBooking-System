import { useEffect, useMemo, useState } from "react";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { courtService } from "../services/courtService";
import BookingSuccessCard from "./BookingSuccessCard";
import {
  addHoursToTime,
  formatTimeDisplay,
  getAvailableStartTimes,
  getDateRange,
  getErrorMessage,
  intersectMultiDayStartTimes,
  normalizeSlots,
  getTodayLocal,
  toApiDate,
} from "../utils/helpers";
import { getStoredUser } from "../utils/auth";

function BookingForm() {
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState("1");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState("PayAtVenue");

  const [slotsByDay, setSlotsByDay] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  function resetForm() {
    setConfirmation(null);
    setDate("");
    setEndDate("");
    setStartTime("");
    setHours("1");
    setPayment("PayAtVenue");
    setSlotsByDay([]);
    setLoadingSlots(false);
    setSubmitting(false);
    setError("");

    const user = getStoredUser();
    setPhone(user?.phone || "");
    setName(user?.name || "");
    setEmail(user?.email || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const numHours = parseInt(hours, 10);
  const isMultiDay = endDate && endDate !== date;

  const availableStarts = useMemo(() => {
    if (!slotsByDay.length) return [];
    if (isMultiDay) return intersectMultiDayStartTimes(slotsByDay, numHours);
    return getAvailableStartTimes(slotsByDay[0], numHours);
  }, [slotsByDay, numHours, isMultiDay]);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.phone) setPhone(user.phone);
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, []);

  useEffect(() => {
    if (!date) {
      setSlotsByDay([]);
      setStartTime("");
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setError("");
      setStartTime("");

      try {
        const range = getDateRange(date, endDate || date);
        const responses = await Promise.all(
          range.map((d) => bookingService.getAvailableTimes(toApiDate(d)))
        );
        const normalized = responses.map((r) => normalizeSlots(r.data));
        setSlotsByDay(normalized);

        const starts =
          range.length > 1
            ? intersectMultiDayStartTimes(normalized, numHours)
            : getAvailableStartTimes(normalized[0], numHours);

        if (!starts.length) {
          const courtsRes = await courtService.getAll();
          if (!courtsRes.data?.length) {
            setError("لا توجد ملاعب مسجلة حالياً");
          } else if (range.length > 1) {
            setError("لا توجد أوقات متاحة لجميع الأيام المحددة");
          } else {
            setError("لا توجد أوقات متاحة في هذا التاريخ");
          }
        }
      } catch (err) {
        setError(getErrorMessage(err, "حدث خطأ أثناء جلب الأوقات"));
        setSlotsByDay([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [date, endDate, hours]);

  useEffect(() => {
    if (startTime && !availableStarts.some((s) => s.startTime === startTime)) {
      setStartTime("");
    }
  }, [availableStarts, startTime]);

  async function processPayment(bookingRes, paymentMethod) {
    const bookingIds = bookingRes.data.bookingIds || [bookingRes.data.bookingId];
    const totalPrice = bookingRes.data.totalPrice;

    const paymentRes = await paymentService.create({
      bookingId: bookingRes.data.bookingId,
      bookingIds,
      paymentMethod,
      amount: totalPrice,
    });

    if (paymentMethod === "Thawani" && paymentRes.data.checkoutUrl) {
      sessionStorage.setItem("pendingPaymentId", paymentRes.data.paymentId);
      sessionStorage.setItem("pendingBookingIds", JSON.stringify(bookingIds));
      sessionStorage.setItem(
        "pendingBookingSummary",
        JSON.stringify({
          bookingId: bookingRes.data.bookingId,
          bookingIds,
          bookingDate: bookingRes.data.bookingDate,
          endDate: bookingRes.data.endDate,
          startTime: bookingRes.data.startTime,
          endTime: bookingRes.data.endTime,
          totalHours: bookingRes.data.totalHours,
          daysCount: bookingRes.data.daysCount,
          paymentType: paymentMethod,
        })
      );
      window.location.href = paymentRes.data.checkoutUrl;
      return null;
    }

    return paymentRes.data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (endDate && endDate < date) {
        setError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
        setSubmitting(false);
        return;
      }

      const endTime = addHoursToTime(startTime, numHours);

      const bookingRes = await bookingService.create({
        phone,
        customerName: name || null,
        customerEmail: email || null,
        bookingDate: toApiDate(date),
        endDate: endDate ? toApiDate(endDate) : null,
        startTime,
        endTime,
        paymentMethod: payment,
      });

      const paymentResult = await processPayment(bookingRes, payment);
      if (paymentResult === null) {
        setSubmitting(false);
        return;
      }

      setConfirmation({
        ...bookingRes.data,
        paymentType: payment,
      });
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء الحجز"));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="form-card">
        <BookingSuccessCard confirmation={confirmation} onNewBooking={resetForm} />
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>حجز ملعب</h2>
      <p className="form-desc">لا حاجة لحساب — أدخل رقم هاتفك فقط. سيتم تعيين ملعب متاح تلقائياً.</p>

      {error && <p className="form-alert form-alert-error">{error}</p>}
      {loadingSlots && <p className="form-alert">جاري تحميل الأوقات المتاحة...</p>}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="date">تاريخ البداية</label>
          <input
            id="date"
            type="date"
            value={date}
            min={getTodayLocal()}
            onChange={(e) => {
              setDate(e.target.value);
              if (endDate && endDate < e.target.value) setEndDate("");
            }}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="endDate">تاريخ النهاية (اختياري — حجز متعدد الأيام)</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={date || getTodayLocal()}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="hours">عدد الساعات</label>
          <select id="hours" value={hours} onChange={(e) => setHours(e.target.value)} required>
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>{h === 1 ? "ساعة واحدة" : h === 2 ? "ساعتان" : `${h} ساعات`}</option>
            ))}
          </select>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="startTime">وقت البداية</label>
          <select
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={!date || loadingSlots || availableStarts.length === 0}
          >
            <option value="">
              {loadingSlots ? "جاري التحميل..." : availableStarts.length === 0 ? "لا توجد أوقات متاحة" : "اختر الوقت"}
            </option>
            {availableStarts.map((slot) => (
              <option key={slot.startTime} value={slot.startTime}>
                {formatTimeDisplay(slot.startTime)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="phone">رقم الهاتف *</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" required />
        </div>

        <div className="form-field">
          <label htmlFor="name">الاسم (اختياري)</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="email">البريد الإلكتروني (اختياري)</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        </div>
      </div>

      <div className="payment-section">
        <p className="payment-label">طريقة الدفع</p>
        <div className="payment-options">
          <label className="payment-option">
            <input type="radio" name="payment" value="PayAtVenue" checked={payment === "PayAtVenue"} onChange={() => setPayment("PayAtVenue")} />
            الدفع عند الوصول (Cash)
          </label>
          <label className="payment-option">
            <input type="radio" name="payment" value="Thawani" checked={payment === "Thawani"} onChange={() => setPayment("Thawani")} />
            الدفع الإلكتروني Thawani
          </label>
        </div>
      </div>

      <button className="btn btn-primary btn-full" type="submit" disabled={submitting || !startTime}>
        {submitting ? "جاري الحجز..." : "تأكيد الحجز"}
      </button>
    </form>
  );
}

export default BookingForm;
