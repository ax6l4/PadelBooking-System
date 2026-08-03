import { Link } from "react-router-dom";
import { Navbar, Footer } from "../components/layout";

function NotFound() {
  return (
    <div className="page">
      <Navbar variant="solid" />
      <main className="page-main">
        <div className="container">
          <div className="form-card not-found-card">
            <h2>404 — الصفحة غير موجودة</h2>
            <p className="form-desc">عذراً، الصفحة التي تبحث عنها غير متوفرة.</p>
            <div className="booking-success-actions">
              <Link to="/" className="btn btn-primary btn-full">
                العودة للرئيسية
              </Link>
              <Link to="/booking" className="btn btn-outline-dark btn-full">
                احجز ملعب
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default NotFound;
