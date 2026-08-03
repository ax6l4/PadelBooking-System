import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, logoutUser } from "../../utils/auth";
import { isAdmin } from "../../utils/helpers";

function Navbar({ variant = "hero" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const navClass = variant === "hero" ? "navbar navbar-hero" : "navbar navbar-solid";

  useEffect(() => {
    setUser(getStoredUser());

    function syncUser() {
      setUser(getStoredUser());
    }

    window.addEventListener("storage", syncUser);
    window.addEventListener("padel-auth-change", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("padel-auth-change", syncUser);
    };
  }, []);

  function handleLogout() {
    logoutUser();
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <nav className={navClass}>
      <Link to="/" className="logo">
        PADEL BOOKING
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-label="القائمة"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
        <Link to="/#courts" onClick={() => setMenuOpen(false)}>الملاعب</Link>
        <Link to="/booking" onClick={() => setMenuOpen(false)}>الحجز</Link>
        {(user && isAdmin(user)) && (
          <Link to="/admin" onClick={() => setMenuOpen(false)}>لوحة التحكم</Link>
        )}
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="nav-btn nav-btn-outline" onClick={handleLogout}>
              خروج
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn nav-btn-outline" onClick={() => setMenuOpen(false)}>
              تسجيل الدخول
            </Link>
            <Link to="/register" className="nav-btn nav-btn-primary" onClick={() => setMenuOpen(false)}>
              إنشاء حساب
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
