import { Link } from "react-router-dom";
import { formatDateDisplay, formatTimeDisplay } from "../utils/helpers";

function getPaymentLabel(method) {
  if (method === "Thawani") return "الدفع الإلكتروني Thawani";
  return "الدفع عند الوصول (Cash)";
}

function formatReference(bookingIds, bookingId) {
  const ids = bookingIds?.length ? bookingIds : bookingId ? [bookingId] : [];
  if (!ids.length) return "—";
  if (ids.length === 1) return `#${ids[0]}`;
  return ids.map((id) => `#${id}`).join(" — ");
}

function BookingSuccessCard({ confirmation }) {
  const {
    bookingId,
    bookingIds,
    bookingDate,
    endDate,
    startTime,
    endTime,
    totalHours,
    daysCount,
    paymentType,
  } = confirmation;

  const dateLabel =
    daysCount > 1
      ? `${formatDateDisplay(bookingDate)} — ${formatDateDisplay(endDate)}`
      : formatDateDisplay(bookingDate);

  return (
    <div className="booking-success">
      <div className="booking-success-header">
        <div className="booking-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="booking-success-title">تم الحجز بنجاح ✅</h2>
        <p className="booking-success-lead">شكراً لك، تم تأكيد حجزك.</p>
        <p className="booking-success-note">سيتم التواصل معك عند الحاجة.</p>
      </div>

      <div className="booking-success-details">
        <div className="booking-success-detail">
          <span className="booking-success-label">التاريخ</span>
          <span className="booking-success-value">{dateLabel}</span>
        </div>
        <div className="booking-success-detail">
          <span className="booking-success-label">الوقت</span>
          <span className="booking-success-value">
            {formatTimeDisplay(startTime)} — {formatTimeDisplay(endTime)}
          </span>
        </div>
        <div className="booking-success-detail">
          <span className="booking-success-label">عدد الساعات</span>
          <span className="booking-success-value">
            {totalHours === 1 ? "ساعة واحدة" : totalHours === 2 ? "ساعتان" : `${totalHours} ساعات`}
          </span>
        </div>
        {daysCount > 1 && (
          <div className="booking-success-detail">
            <span className="booking-success-label">عدد الأيام</span>
            <span className="booking-success-value">{daysCount} أيام</span>
          </div>
        )}
        <div className="booking-success-detail">
          <span className="booking-success-label">طريقة الدفع</span>
          <span className="booking-success-value">{getPaymentLabel(paymentType)}</span>
        </div>
        <div className="booking-success-detail booking-success-detail-highlight">
          <span className="booking-success-label">رقم الحجز</span>
          <span className="booking-success-value booking-success-ref">
            {formatReference(bookingIds, bookingId)}
          </span>
        </div>
      </div>

      {paymentType === "PayAtVenue" && (
        <p className="booking-success-pay-note">
          يمكنك الدفع نقداً عند الوصول إلى الملعب.
        </p>
      )}

      <div className="booking-success-actions">
        <Link to="/" className="btn btn-primary btn-full">
          العودة للرئيسية
        </Link>
        <Link to="/booking" className="btn btn-outline-dark btn-full">
          حجز جديد
        </Link>
      </div>
    </div>
  );
}

export default BookingSuccessCard;
