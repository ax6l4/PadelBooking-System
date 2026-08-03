import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import { getErrorMessage } from "../utils/helpers";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await userService.register({ name, phone, email, password });
      setSuccess("تم إنشاء الحساب بنجاح");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء التسجيل"));
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

        <h1 className="auth-title">إنشاء حساب</h1>
        <p className="auth-subtitle">انضم إلينا واحجز ملعبك بسهولة</p>

        {error && <p className="form-alert form-alert-error">{error}</p>}
        {success && <p className="form-alert form-alert-success">{success}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="register-name">الاسم</label>
            <input
              id="register-name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-phone">رقم الهاتف</label>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">البريد الإلكتروني</label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">كلمة المرور</label>
            <input
              id="register-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "جاري التسجيل..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="auth-footer">
          لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
