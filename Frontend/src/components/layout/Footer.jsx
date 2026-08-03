import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, logoutUser } from "../../utils/auth";
import { isAdmin } from "../../utils/helpers";

function Footer() {
  const user = getStoredUser();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate("/");
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <p className="footer-logo">PADEL BOOKING</p>
          <p className="footer-text">احجز ملعب البادل بسهولة وسرعة</p>
        </div>
        <div className="footer-links">
          <Link to="/">الرئيسية</Link>
          <Link to="/booking">الحجز</Link>
          {user && isAdmin(user) && <Link to="/admin">لوحة التحكم</Link>}
          {user ? (
            <button type="button" className="footer-link-btn" onClick={handleLogout}>
              خروج ({user.name})
            </button>
          ) : (
            <>
              <Link to="/login">تسجيل الدخول</Link>
              <Link to="/register">إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>
      <p className="footer-copy">© 2026 Padel Booking. جميع الحقوق محفوظة.</p>
    </footer>
  );
}

export default Footer;
