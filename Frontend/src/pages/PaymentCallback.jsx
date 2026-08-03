import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookingSuccessCard } from "../components/booking";
import { paymentService } from "../services/paymentService";
import { getErrorMessage } from "../utils/helpers";

function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const urlPaymentId = searchParams.get("paymentId");
    const storedPaymentId = sessionStorage.getItem("pendingPaymentId");
    const paymentId =
      urlPaymentId && urlPaymentId !== "pending"
        ? urlPaymentId
        : storedPaymentId;

    const bookingIds = parseJson(sessionStorage.getItem("pendingBookingIds"));
    const bookingSummary = parseJson(sessionStorage.getItem("pendingBookingSummary"));

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
        sessionStorage.removeItem("pendingBookingSummary");
        setStatus("success");
        setMessage(res.data.message || "تم الدفع وتأكيد الحجز");
        if (bookingSummary) {
          setConfirmation({ ...bookingSummary, paymentType: "Thawani" });
        }
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err, "حدث خطأ أثناء تأكيد الدفع"));
      }
    }

    confirm();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Link to="/" className="auth-logo">PADEL BOOKING</Link>
          <h1 className="auth-title">تأكيد الدفع</h1>
          <p className="auth-subtitle">جاري تأكيد الدفع...</p>
        </div>
      </div>
    );
  }

  if (status === "success" && confirmation) {
    return (
      <div className="page">
        <main className="page-main">
          <div className="container">
            <div className="form-card">
              <BookingSuccessCard confirmation={confirmation} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">PADEL BOOKING</Link>
        <h1 className="auth-title">تأكيد الدفع</h1>

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
