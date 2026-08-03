import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courtService } from "../services/courtService";
import { getErrorMessage, formatTimeDisplay } from "../utils/helpers";

function CourtsBrowse() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    courtService
      .getAll()
      .then((res) => {
        const active = res.data.filter((c) => c.isActive);
        if (!active.length) {
          setSummary(null);
          return;
        }
        const prices = active.map((c) => c.pricePerHour);
        const opens = active.map((c) => c.openingTime?.slice(0, 5) || "08:00");
        const closes = active.map((c) => c.closingTime?.slice(0, 5) || "23:00");
        setSummary({
          count: active.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          earliestOpen: opens.sort()[0],
          latestClose: closes.sort().reverse()[0],
        });
      })
      .catch((err) => setError(getErrorMessage(err, "تعذر تحميل الملاعب")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="courts-loading">جاري تحميل الملاعب...</p>;
  }

  if (error) {
    return <p className="form-alert form-alert-error">{error}</p>;
  }

  if (!summary) {
    return <p className="admin-empty">لا توجد ملاعب متاحة حالياً</p>;
  }

  return (
    <div className="courts-summary">
      <div className="courts-summary-card">
        <h3>{summary.count} {summary.count === 1 ? "ملعب" : "ملاعب"} بادل جاهزة للحجز</h3>
        <p className="court-desc">
          أوقات متاحة من {formatTimeDisplay(summary.earliestOpen)} إلى {formatTimeDisplay(summary.latestClose)}
        </p>
        <p className="court-price">
          {summary.minPrice === summary.maxPrice
            ? `${summary.minPrice} ر.ع / ساعة`
            : `من ${summary.minPrice} إلى ${summary.maxPrice} ر.ع / ساعة`}
        </p>
        <p className="court-desc court-note">
          سيتم تعيين ملعب متاح تلقائياً عند تأكيد الحجز — لا حاجة لاختيار ملعب محدد
        </p>
        <Link to="/booking" className="btn btn-primary court-book-btn">
          احجز الآن
        </Link>
      </div>
    </div>
  );
}

export default CourtsBrowse;
