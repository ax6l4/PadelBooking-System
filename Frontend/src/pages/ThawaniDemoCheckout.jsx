import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/helpers";
import { useState } from "react";

/**
 * صفحة محاكاة بوابة ثواني (Sandbox) لوضع Demo بدون Backend.
 * عند الربط الحقيقي يُحوَّل العميل إلى uatcheckout.thawani.om
 */
function ThawaniDemoCheckout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const paymentId = params.get("paymentId");
  const amount = params.get("amount") || "—";
  const session = params.get("session") || "";

  async function handlePay() {
    if (!paymentId) {
      setError("معرف الدفع غير موجود");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // في Demo: التأكيد مباشر. مع Backend الحقيقي: ثواني تستدعي success_url بعد الدفع.
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
        <h1 className="auth-title">الدفع الإلكتروني</h1>
        <p className="auth-subtitle">
          بيئة اختبار ثواني — لن يتم خصم مبلغ حقيقي
        </p>

        <div className="thawani-demo-amount">
          <span>المبلغ المستحق</span>
          <strong>{amount} ر.ع</strong>
        </div>

        {error && <p className="form-alert form-alert-error">{error}</p>}

        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={handlePay}
          disabled={busy || !paymentId}
        >
          {busy ? "جاري التحويل..." : "إتمام الدفع (Sandbox)"}
        </button>

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
