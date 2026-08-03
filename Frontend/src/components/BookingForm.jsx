import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { courtService } from "../services/courtService";
import {
  addHoursToTime,
  formatDateDisplay,
  formatTimeDisplay,
  getAvailableStartTimes,
  getErrorMessage,
  normalizeSlots,
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

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const availableStarts = getAvailableStartTimes(slots, parseInt(hours, 10));

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
      setSlots([]);
      setStartTime("");
      return;
    }

    async function loadSlots() {
      setLoadingSlots(true);
      setError("");
      setStartTime("");

      try {
        const res = await bookingService.getAvailableTimes(toApiDate(date));
        const normalized = normalizeSlots(res.data);
        setSlots(normalized);

        if (!normalized.some((s) => s.available)) {
          try {
            const courtsRes = await courtService.getAll();
            if (!courtsRes.data?.length) {
              setError("لا توجد ملاعب مسجلة. أضف ملاعباً من لوحة الإدارة (/admin) أولاً");
            } else {
              setError("لا توجد أوقات متاحة في هذا التاريخ");
            }
          } catch {
            setError("لا توجد أوقات متاحة");
          }
        }
      } catch (err) {
        setError(getErrorMessage(err, "حدث خطأ أثناء جلب الأوقات"));
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [date]);

  useEffect(() => {
    if (startTime && !availableStarts.some((s) => s.startTime === startTime)) {
      setStartTime("");
    }
  }, [hours, availableStarts, startTime]);

  async function processPayment(bookingRes, paymentMethod) {
    const bookingIds = bookingRes.data.bookingIds || [bookingRes.data.bookingId];
    const totalPrice = bookingRes.data.totalPrice;

    const paymentRes = await paymentService.create({
      bookingId: bookingRes.data.bookingId,
      paymentMethod,
      amount: totalPrice,
    });

    if (paymentMethod === "Thawani" && paymentRes.data.checkoutUrl) {
      sessionStorage.setItem("pendingPaymentId", paymentRes.data.paymentId);
      sessionStorage.setItem("pendingBookingIds", JSON.stringify(bookingIds));
      window.location.href = paymentRes.data.checkoutUrl;
      return null;
    }

    await paymentService.confirm(paymentRes.data.paymentId, bookingIds);
    return paymentRes.data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const numHours = parseInt(hours, 10);
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
      if (paymentResult === null) return;

      setConfirmation({
        ...bookingRes.data,
        paymentType: "PayAtVenue",
        message: "تم الحجز بنجاح",
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
        <h2>تأكيد الحجز</h2>
        <p className="form-alert form-alert-success">
          {confirmation.message || "تم إنشاء الحجز بنجاح"}
        </p>

        <div className="confirmation-details">
          <p><strong>رقم الحجز:</strong> {confirmation.bookingIds?.join(", ") || confirmation.bookingId}</p>
          <p><strong>التاريخ:</strong> {formatDateDisplay(confirmation.bookingDate)}
            {confirmation.daysCount > 1 && ` — ${formatDateDisplay(confirmation.endDate)}`}
          </p>
          <p><strong>الوقت:</strong> {formatTimeDisplay(confirmation.startTime)} - {formatTimeDisplay(confirmation.endTime)}</p>
          <p><strong>عدد الساعات:</strong> {confirmation.totalHours}</p>
          {confirmation.daysCount > 1 && <p><strong>عدد الأيام:</strong> {confirmation.daysCount}</p>}
          <p><strong>المبلغ:</strong> {confirmation.totalPrice} ر.ع</p>
        </div>

        {confirmation.paymentType === "PayAtVenue" && (
          <p className="form-desc" style={{ marginTop: "16px" }}>
            تم تأكيد حجزك. يمكنك الدفع نقداً (Cash) عند الوصول.
          </p>
        )}

        <Link to="/" className="btn btn-outline-dark btn-full" style={{ marginTop: "20px", borderRadius: "12px" }}>
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>حجز ملعب</h2>
      <p className="form-desc">لا حاجة لحساب — أدخل رقم هاتفك فقط</p>

      {error && <p className="form-alert form-alert-error">{error}</p>}
      {loadingSlots && <p className="form-alert">جاري تحميل الأوقات المتاحة...</p>}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="date">تاريخ البداية</label>
          <input
            id="date"
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="endDate">تاريخ النهاية (اختياري)</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={date || new Date().toISOString().split("T")[0]}
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
