import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { userService } from "../services/userService";
import { saveUser } from "../utils/auth";
import { getErrorMessage, isAdmin } from "../utils/helpers";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await userService.login({ email, password });
      saveUser(res.data);

      if (isAdmin(res.data)) {
        navigate(redirectTo || "/admin");
      } else {
        navigate("/booking");
      }
    } catch (err) {
      setError(getErrorMessage(err, "البريد أو كلمة المرور غير صحيحة"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          PADEL BOOKING
        </Link>

        <h1 className="auth-title">تسجيل الدخول</h1>
        <p className="auth-subtitle">
          مرحباً بعودتك! سجّل دخولك للمتابعة
          <br />
          <small>مدير: admin@padel.com / admin123 — عميل: customer@padel.com / 123456</small>
        </p>

        {error && <p className="form-alert form-alert-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-email">البريد الإلكتروني</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">كلمة المرور</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="auth-footer">
          ليس لديك حساب؟ <Link to="/register">إنشاء حساب</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
