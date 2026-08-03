import { useLocation } from "react-router-dom";
import { Navbar, Footer } from "../components/layout";
import { BookingForm } from "../components/booking";

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
