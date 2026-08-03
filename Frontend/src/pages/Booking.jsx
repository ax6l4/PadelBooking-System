import Navbar from "../components/Navbar";
import BookingForm from "../components/BookingForm";
import Footer from "../components/Footer";

function Booking() {
  return (
    <div className="page">
      <Navbar variant="solid" />
      <main className="page-main">
        <div className="container">
          <BookingForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Booking;
