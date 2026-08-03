import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { courtService } from "../services/courtService";
import { bookingService } from "../services/bookingService";
import { offerService } from "../services/offerService";
import { paymentService } from "../services/paymentService";
import { closureService } from "../services/closureService";
import { workingHourService } from "../services/workingHourService";
import {
  bookingStatusLabel,
  formatBookingDate,
  formatTimeDisplay,
  getErrorMessage,
  normalizeTime,
  paymentMethodLabel,
  paymentStatusLabel,
  prepareCourtPayload,
  prepareOfferPayload,
  toApiDate,
} from "../utils/helpers";

const emptyCourt = {
  name: "",
  description: "",
  pricePerHour: 15,
  openingTime: "08:00:00",
  closingTime: "23:00:00",
  isActive: true,
};

const emptyOffer = {
  courtId: "",
  minimumHours: 2,
  pricePerHour: 10,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "2026-12-31",
  isActive: true,
};

function AdminDashboard() {
  const [section, setSection] = useState("courts");
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterCourtId, setFilterCourtId] = useState("");

  const [closures, setClosures] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [closureForm, setClosureForm] = useState({
    courtIds: "all",
    selectedCourtIds: [],
    startDate: "",
    endDate: "",
    weekdays: [],
    reason: "",
  });
  const [whForm, setWhForm] = useState({
    courtId: "",
    dayOfWeek: 0,
    startTime: "08:00",
    endTime: "23:00",
  });

  const [showCourtForm, setShowCourtForm] = useState(false);
  const [courtForm, setCourtForm] = useState(emptyCourt);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [savingCourt, setSavingCourt] = useState(false);

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [savingOffer, setSavingOffer] = useState(false);

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function loadCourts() {
    const res = await courtService.getAll();
    setCourts(res.data);
    return res.data;
  }

  async function loadBookings() {
    const params = {};
    if (filterDate) params.date = filterDate;
    if (filterPhone) params.phone = filterPhone;
    if (filterStatus !== "") params.status = parseInt(filterStatus, 10);
    if (filterCourtId) params.courtId = parseInt(filterCourtId, 10);
    if (filterPayment !== "") params.paymentMethod = parseInt(filterPayment, 10);
    const res = await bookingService.getAll(params);
    setBookings(res.data);
  }

  async function loadClosures() {
    const res = await closureService.getAll();
    setClosures(res.data);
  }

  async function loadWorkingHours() {
    const res = await workingHourService.getAll();
    setWorkingHours(res.data);
  }

  async function loadOffers() {
    const res = await offerService.getAll();
    setOffers(res.data);
  }

  async function loadPayments() {
    const res = await paymentService.getAll();
    setPayments(res.data);
  }

  async function loadSection() {
    setLoading(true);
    setError("");
    try {
      if (section === "courts") await loadCourts();
      if (section === "bookings") {
        await loadCourts();
        await loadBookings();
      }
      if (section === "offers") {
        await loadCourts();
        await loadOffers();
      }
      if (section === "payments") await loadPayments();
      if (section === "closures") {
        await loadCourts();
        await loadClosures();
      }
      if (section === "working-hours") {
        await loadCourts();
        await loadWorkingHours();
      }
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء تحميل البيانات — تأكد أن Backend يعمل"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSection();
  }, [section]);

  useEffect(() => {
    if (section === "bookings") {
      loadBookings().catch((err) =>
        setError(getErrorMessage(err, "حدث خطأ أثناء تحميل الحجوزات"))
      );
    }
  }, [filterDate, filterPhone, filterStatus, filterCourtId, filterPayment]);

  function openAddCourt() {
    setCourtForm(emptyCourt);
    setEditingCourtId(null);
    setShowCourtForm(true);
  }

  function openEditCourt(court) {
    setCourtForm({
      name: court.name,
      description: court.description || "",
      pricePerHour: court.pricePerHour,
      openingTime: normalizeTime(court.openingTime) || "08:00:00",
      closingTime: normalizeTime(court.closingTime) || "23:00:00",
      isActive: court.isActive,
    });
    setEditingCourtId(court.id);
    setShowCourtForm(true);
  }

  async function saveCourt(e) {
    e.preventDefault();
    setSavingCourt(true);
    setError("");

    try {
      const payload = prepareCourtPayload(courtForm);
      if (editingCourtId) {
        await courtService.update(editingCourtId, payload);
        showSuccess("تم تعديل الملعب بنجاح");
      } else {
        await courtService.create(payload);
        showSuccess("تم إضافة الملعب بنجاح");
      }
      setShowCourtForm(false);
      await loadCourts();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء حفظ الملعب"));
    } finally {
      setSavingCourt(false);
    }
  }

  async function deleteCourt(id) {
    if (!window.confirm("حذف هذا الملعب؟")) return;
    setError("");
    try {
      await courtService.delete(id);
      showSuccess("تم حذف الملعب");
      await loadCourts();
    } catch (err) {
      setError(getErrorMessage(err, "لا يمكن حذف الملعب — قد يكون مرتبطاً بحجوزات"));
    }
  }

  function openAddOffer() {
    if (courts.length === 0) {
      setError("أضف ملعباً أولاً من قسم الملاعب");
      return;
    }
    setOfferForm({ ...emptyOffer, courtId: courts[0].id });
    setEditingOfferId(null);
    setShowOfferForm(true);
  }

  function openEditOffer(offer) {
    setOfferForm({
      courtId: offer.courtId,
      minimumHours: offer.minimumHours,
      pricePerHour: offer.pricePerHour,
      startDate: formatBookingDate(offer.startDate),
      endDate: formatBookingDate(offer.endDate),
      isActive: offer.isActive,
    });
    setEditingOfferId(offer.id);
    setShowOfferForm(true);
  }

  async function saveOffer(e) {
    e.preventDefault();
    setSavingOffer(true);
    setError("");

    try {
      const payload = prepareOfferPayload(offerForm);
      if (editingOfferId) {
        await offerService.update(editingOfferId, payload);
        showSuccess("تم تعديل العرض بنجاح");
      } else {
        await offerService.create(payload);
        showSuccess("تم إضافة العرض بنجاح");
      }
      setShowOfferForm(false);
      await loadOffers();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء حفظ العرض"));
    } finally {
      setSavingOffer(false);
    }
  }

  async function deleteOffer(id) {
    if (!window.confirm("حذف هذا العرض؟")) return;
    try {
      await offerService.delete(id);
      showSuccess("تم حذف العرض");
      await loadOffers();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء الحذف"));
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm("إلغاء هذا الحجز؟")) return;
    try {
      await bookingService.cancel(id);
      showSuccess("تم إلغاء الحجز");
      await loadBookings();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء الإلغاء"));
    }
  }

  async function confirmPayment(id) {
    try {
      await paymentService.confirm(id);
      showSuccess("تم تأكيد الدفع");
      await loadPayments();
      if (section === "bookings") await loadBookings();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء تأكيد الدفع"));
    }
  }

  async function saveBulkClosure(e) {
    e.preventDefault();
    setError("");
    try {
      let courtIds = null;
      if (closureForm.courtIds === "multiple") {
        courtIds = closureForm.selectedCourtIds.map((id) => parseInt(id, 10));
        if (!courtIds.length) {
          setError("اختر ملعباً واحداً على الأقل");
          return;
        }
      } else if (closureForm.courtIds !== "all") {
        courtIds = [parseInt(closureForm.courtIds, 10)];
      }

      const payload = {
        startDate: toApiDate(closureForm.startDate),
        endDate: toApiDate(closureForm.endDate || closureForm.startDate),
        reason: closureForm.reason,
        courtIds,
        weekdays: closureForm.weekdays.length ? closureForm.weekdays.map(Number) : null,
      };
      await closureService.createBulk(payload);
      showSuccess("تم إغلاق الملاعب بنجاح");
      setClosureForm({ courtIds: "all", selectedCourtIds: [], startDate: "", endDate: "", weekdays: [], reason: "" });
      await loadClosures();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ أثناء الإغلاق"));
    }
  }

  async function deleteClosure(id) {
    if (!window.confirm("حذف هذا الإغلاق؟")) return;
    try {
      await closureService.delete(id);
      showSuccess("تم حذف الإغلاق");
      await loadClosures();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ"));
    }
  }

  async function saveWorkingHour(e) {
    e.preventDefault();
    setError("");
    try {
      await workingHourService.create({
        courtId: parseInt(whForm.courtId, 10),
        dayOfWeek: parseInt(whForm.dayOfWeek, 10),
        startTime: `${whForm.startTime}:00`,
        endTime: `${whForm.endTime}:00`,
      });
      showSuccess("تم حفظ وقت العمل");
      await loadWorkingHours();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ"));
    }
  }

  async function deleteWorkingHour(id) {
    try {
      await workingHourService.delete(id);
      showSuccess("تم الحذف");
      await loadWorkingHours();
    } catch (err) {
      setError(getErrorMessage(err, "حدث خطأ"));
    }
  }

  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const filteredBookings = bookings;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo">PADEL BOOKING</Link>
        <p className="admin-label">لوحة التحكم</p>
        <button type="button" className={section === "courts" ? "active" : ""} onClick={() => setSection("courts")}>
          الملاعب
        </button>
        <button type="button" className={section === "working-hours" ? "active" : ""} onClick={() => setSection("working-hours")}>
          أوقات العمل
        </button>
        <button type="button" className={section === "closures" ? "active" : ""} onClick={() => setSection("closures")}>
          الإغلاقات
        </button>
        <button type="button" className={section === "bookings" ? "active" : ""} onClick={() => setSection("bookings")}>
          الحجوزات
        </button>
        <button type="button" className={section === "offers" ? "active" : ""} onClick={() => setSection("offers")}>
          العروض
        </button>
        <button type="button" className={section === "payments" ? "active" : ""} onClick={() => setSection("payments")}>
          الدفع
        </button>
      </aside>

      <main className="admin-main">
        {loading && <p className="form-alert">جاري التحميل...</p>}
        {error && <p className="form-alert form-alert-error">{error}</p>}
        {success && <p className="form-alert form-alert-success">{success}</p>}

        {section === "courts" && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>الملاعب</h1>
              <button type="button" className="btn btn-primary" onClick={openAddCourt}>
                + إضافة ملعب
              </button>
            </div>

            {showCourtForm && (
              <form className="admin-form-panel" onSubmit={saveCourt}>
                <h2>{editingCourtId ? "تعديل ملعب" : "إضافة ملعب جديد"}</h2>
                <div className="form-grid">
                  <div className="form-field">
                    <label>اسم الملعب</label>
                    <input
                      value={courtForm.name}
                      onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>السعر/ساعة (ر.ع)</label>
                    <input
                      type="number"
                      min="1"
                      value={courtForm.pricePerHour}
                      onChange={(e) => setCourtForm({ ...courtForm, pricePerHour: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field form-field-full">
                    <label>الوصف</label>
                    <input
                      value={courtForm.description}
                      onChange={(e) => setCourtForm({ ...courtForm, description: e.target.value })}
                      placeholder="وصف الملعب (اختياري)"
                    />
                  </div>
                  <div className="form-field">
                    <label>وقت الفتح</label>
                    <input
                      type="time"
                      value={formatTimeDisplay(courtForm.openingTime)}
                      onChange={(e) =>
                        setCourtForm({
                          ...courtForm,
                          openingTime: e.target.value ? `${e.target.value}:00` : "08:00:00",
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>وقت الإغلاق</label>
                    <input
                      type="time"
                      value={formatTimeDisplay(courtForm.closingTime)}
                      onChange={(e) =>
                        setCourtForm({
                          ...courtForm,
                          closingTime: e.target.value ? `${e.target.value}:00` : "23:00:00",
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-field form-field-full">
                    <label className="payment-option">
                      <input
                        type="checkbox"
                        checked={courtForm.isActive}
                        onChange={(e) => setCourtForm({ ...courtForm, isActive: e.target.checked })}
                      />
                      ملعب فعال
                    </label>
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingCourt}>
                    {savingCourt ? "جاري الحفظ..." : "حفظ"}
                  </button>
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowCourtForm(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            <div className="admin-table-wrap">
              {courts.length === 0 ? (
                <p className="admin-empty">لا توجد ملاعب — اضغط «إضافة ملعب» للبدء</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الاسم</th>
                      <th>السعر/ساعة</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courts.map((court) => (
                      <tr key={court.id}>
                        <td>{court.id}</td>
                        <td>{court.name}</td>
                        <td>{court.pricePerHour} ر.ع</td>
                        <td>{court.isActive ? "فعال" : "غير فعال"}</td>
                        <td className="actions">
                          <button type="button" onClick={() => openEditCourt(court)}>تعديل</button>
                          <button type="button" className="danger" onClick={() => deleteCourt(court.id)}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {section === "bookings" && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>الحجوزات</h1>
            </div>
            <div className="filter-bar">
              <select value={filterCourtId} onChange={(e) => setFilterCourtId(e.target.value)}>
                <option value="">كل الملاعب</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              <input type="text" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} placeholder="رقم الهاتف" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="0">قيد الانتظار</option>
                <option value="1">مؤكد</option>
                <option value="2">ملغي</option>
                <option value="3">مكتمل</option>
              </select>
              <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                <option value="">كل طرق الدفع</option>
                <option value="0">الدفع عند الوصول</option>
                <option value="1">Thawani</option>
              </select>
              <button type="button" className="btn btn-outline-dark" onClick={() => { setFilterDate(""); setFilterPhone(""); setFilterStatus(""); setFilterPayment(""); setFilterCourtId(""); }}>
                مسح الفلتر
              </button>
            </div>
            <div className="admin-table-wrap">
              {filteredBookings.length === 0 ? (
                <p className="admin-empty">لا توجد حجوزات</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الملعب</th>
                      <th>الهاتف</th>
                      <th>التاريخ</th>
                      <th>الوقت</th>
                      <th>الساعات</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                      <th>الدفع</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>{b.court?.name || `#${b.courtId}`}</td>
                        <td>{b.phone}</td>
                        <td>{formatBookingDate(b.bookingDate)}</td>
                        <td>{formatTimeDisplay(b.startTime)}</td>
                        <td>{b.totalHours}</td>
                        <td>{b.totalPrice} ر.ع</td>
                        <td>{bookingStatusLabel[b.status] ?? b.status}</td>
                        <td>{paymentMethodLabel[b.paymentMethod] ?? b.paymentMethod}</td>
                        <td className="actions">
                          {b.status !== 2 && b.status !== "Cancelled" && (
                            <button type="button" className="danger" onClick={() => cancelBooking(b.id)}>إلغاء</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {section === "offers" && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>العروض</h1>
              <button type="button" className="btn btn-primary" onClick={openAddOffer}>
                + إضافة عرض
              </button>
            </div>

            {showOfferForm && (
              <form className="admin-form-panel" onSubmit={saveOffer}>
                <h2>{editingOfferId ? "تعديل عرض" : "إضافة عرض جديد"}</h2>
                <div className="form-grid">
                  <div className="form-field form-field-full">
                    <label>الملعب</label>
                    <select
                      value={offerForm.courtId}
                      onChange={(e) => setOfferForm({ ...offerForm, courtId: e.target.value })}
                      required
                    >
                      <option value="">اختر الملعب</option>
                      {courts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>أقل عدد ساعات</label>
                    <input type="number" min="1" value={offerForm.minimumHours} onChange={(e) => setOfferForm({ ...offerForm, minimumHours: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>السعر/ساعة (ر.ع)</label>
                    <input type="number" min="1" value={offerForm.pricePerHour} onChange={(e) => setOfferForm({ ...offerForm, pricePerHour: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>تاريخ البداية</label>
                    <input type="date" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label>تاريخ النهاية</label>
                    <input type="date" value={offerForm.endDate} onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })} required />
                  </div>
                  <div className="form-field form-field-full">
                    <label className="payment-option">
                      <input type="checkbox" checked={offerForm.isActive} onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })} />
                      عرض فعال
                    </label>
                  </div>
                </div>
                <div className="admin-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={savingOffer}>
                    {savingOffer ? "جاري الحفظ..." : "حفظ"}
                  </button>
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowOfferForm(false)}>إلغاء</button>
                </div>
              </form>
            )}

            <div className="admin-cards">
              {offers.length === 0 ? (
                <p className="admin-empty">لا توجد عروض</p>
              ) : (
                offers.map((offer) => (
                  <div className="admin-card" key={offer.id}>
                    <h3>{offer.court?.name || `ملعب #${offer.courtId}`}</h3>
                    <p>السعر: {offer.pricePerHour} ر.ع / ساعة</p>
                    <p>أقل ساعات: {offer.minimumHours}</p>
                    <p>الفترة: {formatBookingDate(offer.startDate)} — {formatBookingDate(offer.endDate)}</p>
                    <p>الحالة: {offer.isActive ? "فعال" : "غير فعال"}</p>
                    <div className="actions">
                      <button type="button" onClick={() => openEditOffer(offer)}>تعديل</button>
                      <button type="button" className="danger" onClick={() => deleteOffer(offer.id)}>حذف</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {section === "working-hours" && (
          <div className="admin-section">
            <div className="admin-header"><h1>أوقات العمل</h1></div>
            <form className="admin-form-panel" onSubmit={saveWorkingHour}>
              <h2>إضافة وقت عمل لملعب</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label>الملعب</label>
                  <select value={whForm.courtId} onChange={(e) => setWhForm({ ...whForm, courtId: e.target.value })} required>
                    <option value="">اختر الملعب</option>
                    {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>اليوم</label>
                  <select value={whForm.dayOfWeek} onChange={(e) => setWhForm({ ...whForm, dayOfWeek: e.target.value })}>
                    {dayNames.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>من</label>
                  <input type="time" value={whForm.startTime} onChange={(e) => setWhForm({ ...whForm, startTime: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label>إلى</label>
                  <input type="time" value={whForm.endTime} onChange={(e) => setWhForm({ ...whForm, endTime: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">حفظ</button>
            </form>
            <div className="admin-table-wrap">
              {workingHours.length === 0 ? (
                <p className="admin-empty">لا توجد أوقات عمل مخصصة — يُستخدم وقت الفتح/الإغلاق الافتراضي</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>الملعب</th><th>اليوم</th><th>من</th><th>إلى</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {workingHours.map((wh) => (
                      <tr key={wh.id}>
                        <td>{wh.court?.name || wh.courtId}</td>
                        <td>{dayNames[wh.dayOfWeek]}</td>
                        <td>{formatTimeDisplay(wh.startTime)}</td>
                        <td>{formatTimeDisplay(wh.endTime)}</td>
                        <td><button type="button" className="danger" onClick={() => deleteWorkingHour(wh.id)}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {section === "closures" && (
          <div className="admin-section">
            <div className="admin-header"><h1>إغلاق الملاعب</h1></div>
            <form className="admin-form-panel" onSubmit={saveBulkClosure}>
              <h2>إغلاق ملعب / كل الملاعب</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label>الملعب</label>
                  <select value={closureForm.courtIds} onChange={(e) => setClosureForm({ ...closureForm, courtIds: e.target.value, selectedCourtIds: [] })}>
                    <option value="all">كل الملاعب</option>
                    <option value="multiple">عدة ملاعب</option>
                    {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {closureForm.courtIds === "multiple" && (
                  <div className="form-field form-field-full">
                    <label>اختر الملاعب</label>
                    <div className="payment-options">
                      {courts.map((c) => (
                        <label key={c.id} className="payment-option">
                          <input
                            type="checkbox"
                            checked={closureForm.selectedCourtIds.includes(String(c.id))}
                            onChange={(e) => {
                              const id = String(c.id);
                              setClosureForm({
                                ...closureForm,
                                selectedCourtIds: e.target.checked
                                  ? [...closureForm.selectedCourtIds, id]
                                  : closureForm.selectedCourtIds.filter((x) => x !== id),
                              });
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="form-field form-field-full">
                  <label>أيام محددة (اختياري — اترك فارغاً لإغلاق كل الأيام)</label>
                  <div className="payment-options">
                    {dayNames.map((d, i) => (
                      <label key={d} className="payment-option">
                        <input
                          type="checkbox"
                          checked={closureForm.weekdays.includes(i)}
                          onChange={(e) => {
                            setClosureForm({
                              ...closureForm,
                              weekdays: e.target.checked
                                ? [...closureForm.weekdays, i]
                                : closureForm.weekdays.filter((x) => x !== i),
                            });
                          }}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label>من تاريخ</label>
                  <input type="date" value={closureForm.startDate} onChange={(e) => setClosureForm({ ...closureForm, startDate: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label>إلى تاريخ</label>
                  <input type="date" value={closureForm.endDate} onChange={(e) => setClosureForm({ ...closureForm, endDate: e.target.value })} />
                </div>
                <div className="form-field form-field-full">
                  <label>السبب</label>
                  <input value={closureForm.reason} onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })} placeholder="صيانة، مناسبة..." />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">تطبيق الإغلاق</button>
            </form>
            <div className="admin-table-wrap">
              {closures.length === 0 ? (
                <p className="admin-empty">لا توجد إغلاقات</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>الملعب</th><th>التاريخ</th><th>السبب</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {closures.map((c) => (
                      <tr key={c.id}>
                        <td>{c.court?.name || c.courtId}</td>
                        <td>{formatBookingDate(c.date)}</td>
                        <td>{c.reason || "—"}</td>
                        <td><button type="button" className="danger" onClick={() => deleteClosure(c.id)}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {section === "payments" && (
          <div className="admin-section">
            <div className="admin-header">
              <h1>الدفع</h1>
            </div>
            <div className="admin-table-wrap">
              {payments.length === 0 ? (
                <p className="admin-empty">لا توجد عمليات دفع</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>رقم الحجز</th>
                      <th>المبلغ</th>
                      <th>الطريقة</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.bookingId}</td>
                        <td>{p.amount} ر.ع</td>
                        <td>{paymentMethodLabel[p.paymentMethod] ?? p.paymentMethod}</td>
                        <td>{paymentStatusLabel[p.status] ?? p.status}</td>
                        <td className="actions">
                          {(p.status === 0 || p.status === "Pending") && (
                            <button type="button" onClick={() => confirmPayment(p.id)}>تأكيد</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
