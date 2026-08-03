import { Link } from "react-router-dom";
import { getStoredUser } from "../utils/auth";
import { isAdmin } from "../utils/helpers";

function Footer() {
  const user = getStoredUser();

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
          <Link to="/login">تسجيل الدخول</Link>
          <Link to="/register">إنشاء حساب</Link>
        </div>
      </div>
      <p className="footer-copy">© 2026 Padel Booking. جميع الحقوق محفوظة.</p>
    </footer>
  );
}

export default Footer;
