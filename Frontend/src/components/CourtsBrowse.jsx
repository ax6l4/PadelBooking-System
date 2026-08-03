import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courtService } from "../services/courtService";
import { getErrorMessage } from "../utils/helpers";

function CourtsBrowse() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    courtService
      .getAll()
      .then((res) => setCourts(res.data.filter((c) => c.isActive)))
      .catch((err) => setError(getErrorMessage(err, "تعذر تحميل الملاعب")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="courts-loading">جاري تحميل الملاعب...</p>;
  }

  if (error) {
    return <p className="form-alert form-alert-error">{error}</p>;
  }

  return (
    <div className="court-cards">
      {courts.map((court) => (
        <article key={court.id} className="court-card">
          <div className="court-card-header">
            <h3>{court.name}</h3>
            <span className="court-price">{court.pricePerHour} ر.ع / ساعة</span>
          </div>
          {court.description && (
            <p className="court-desc">{court.description}</p>
          )}
          <p className="court-hours">
            {court.openingTime?.slice(0, 5)} — {court.closingTime?.slice(0, 5)}
          </p>
          <Link to="/booking" className="btn btn-primary court-book-btn">
            احجز هذا الملعب
          </Link>
        </article>
      ))}
    </div>
  );
}

export default CourtsBrowse;
