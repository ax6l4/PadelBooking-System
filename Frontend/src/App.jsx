import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemoBanner } from "./components/layout";
import { AdminRoute } from "./components/auth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentCallback from "./pages/PaymentCallback";
import ThawaniDemoCheckout from "./pages/ThawaniDemoCheckout";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <DemoBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/payment/thawani-demo" element={<ThawaniDemoCheckout />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
