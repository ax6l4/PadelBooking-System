import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/helpers";
import { useState } from "react";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * صفحة دفع ثواني (Sandbox) — تطلب بيانات البطاقة ثم تؤكد الدفع.
 * في الوضع الحقيقي مع Backend يتم التحويل إلى بوابة ثواني UAT.
 */
function ThawaniDemoCheckout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const paymentId = params.get("paymentId");
  const amount = params.get("amount") || "—";
  const session = params.get("session") || "";

  function validateCard() {
    if (!cardName.trim() || cardName.trim().length < 3) {
      return "أدخل اسم حامل البطاقة كما هو مدون عليها";
    }
    const number = onlyDigits(cardNumber);
    if (number.length < 16) {
      return "رقم البطاقة يجب أن يكون 16 رقماً";
    }
    const exp = onlyDigits(expiry);
    if (exp.length !== 4) {
      return "أدخل تاريخ الانتهاء بالصيغة MM/YY";
    }
    const month = parseInt(exp.slice(0, 2), 10);
    if (month < 1 || month > 12) {
      return "شهر الانتهاء غير صحيح";
    }
    if (onlyDigits(cvv).length < 3) {
      return "أدخل رمز CVV (3 أو 4 أرقام)";
    }
    return "";
  }

  async function handlePay(e) {
    e.preventDefault();
    if (!paymentId) {
      setError("معرف الدفع غير موجود");
      return;
    }

    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      // Sandbox: لا تُرسل بيانات البطاقة لأي خادم — محاكاة محلية فقط
      await new Promise((r) => setTimeout(r, 700));
      navigate(`/payment/callback?paymentId=${paymentId}&session=${encodeURIComponent(session)}`);
    } catch (err) {
      setError(getErrorMessage(err, "تعذر إتمام الدفع"));
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (paymentId) {
      try {
        await paymentService.fail(paymentId);
      } catch {
        /* تجاهل في Demo */
      }
    }
    navigate("/booking?payment=cancelled");
  }

  return (
    <div className="auth-page">
      <div className="auth-card thawani-demo-card">
        <p className="thawani-demo-badge">Thawani Sandbox</p>
        <h1 className="auth-title">الدفع بالبطاقة</h1>
        <p className="auth-subtitle">
          أدخل بيانات بطاقتك البنكية لإتمام الدفع عبر ثواني
          <br />
          <small>بيئة اختبار — لن يتم خصم مبلغ حقيقي</small>
        </p>

        <div className="thawani-demo-amount">
          <span>المبلغ المستحق</span>
          <strong>{amount} ر.ع</strong>
        </div>

        {error && <p className="form-alert form-alert-error">{error}</p>}

        <form className="auth-form thawani-card-form" onSubmit={handlePay}>
          <div className="form-field">
            <label htmlFor="card-name">اسم حامل البطاقة</label>
            <input
              id="card-name"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="الاسم كما على البطاقة"
              autoComplete="cc-name"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="card-number">رقم البطاقة</label>
            <input
              id="card-number"
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="•••• •••• •••• ••••"
              autoComplete="cc-number"
              required
            />
          </div>

          <div className="form-grid thawani-card-row">
            <div className="form-field">
              <label htmlFor="card-expiry">تاريخ الانتهاء</label>
              <input
                id="card-expiry"
                type="text"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                autoComplete="cc-exp"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="card-cvv">CVV</label>
              <input
                id="card-cvv"
                type="password"
                inputMode="numeric"
                value={cvv}
                onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                placeholder="•••"
                autoComplete="cc-csc"
                required
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={busy || !paymentId}
          >
            {busy ? "جاري الدفع..." : `ادفع ${amount} ر.ع`}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-outline-dark btn-full"
          style={{ marginTop: 12 }}
          onClick={handleCancel}
          disabled={busy}
        >
          إلغاء الدفع
        </button>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/booking">العودة للحجز</Link>
        </p>
      </div>
    </div>
  );
}

export default ThawaniDemoCheckout;
