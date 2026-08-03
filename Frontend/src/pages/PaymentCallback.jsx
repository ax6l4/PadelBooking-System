import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/helpers";

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlPaymentId = searchParams.get("paymentId");
    const storedPaymentId = sessionStorage.getItem("pendingPaymentId");
    const paymentId =
      urlPaymentId && urlPaymentId !== "pending"
        ? urlPaymentId
        : storedPaymentId;

    const bookingIdsRaw = sessionStorage.getItem("pendingBookingIds");
    const bookingIds = bookingIdsRaw ? JSON.parse(bookingIdsRaw) : null;

    if (!paymentId) {
      setStatus("error");
      setMessage("لم يتم العثور على معرف الدفع");
      return;
    }

    async function confirm() {
      try {
        const res = await paymentService.confirm(paymentId, bookingIds);
        sessionStorage.removeItem("pendingPaymentId");
        sessionStorage.removeItem("pendingBookingIds");
        setStatus("success");
        setMessage(res.data.message || "تم الدفع وتأكيد الحجز");
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err, "حدث خطأ أثناء تأكيد الدفع"));
      }
    }

    confirm();
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">PADEL BOOKING</Link>
        <h1 className="auth-title">تأكيد الدفع</h1>

        {status === "loading" && <p className="auth-subtitle">جاري تأكيد الدفع...</p>}

        {status === "success" && (
          <>
            <p className="form-alert form-alert-success">{message}</p>
            <Link to="/" className="btn btn-primary btn-full">العودة للرئيسية</Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="form-alert form-alert-error">{message}</p>
            <Link to="/booking" className="btn btn-primary btn-full">العودة للحجز</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentCallback;
