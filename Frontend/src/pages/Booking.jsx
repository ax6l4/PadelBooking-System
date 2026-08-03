import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookingForm from "../components/BookingForm";
import Footer from "../components/Footer";

function Booking() {
  const location = useLocation();

  return (
    <div className="page">
      <Navbar variant="solid" />
      <main className="page-main">
        <div className="container">
          <BookingForm key={location.key} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Booking;
