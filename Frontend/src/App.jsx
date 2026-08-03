import { BrowserRouter, Routes, Route } from "react-router-dom";
import DemoBanner from "./components/DemoBanner";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Booking from "./pages/Booking";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentCallback from "./pages/PaymentCallback";

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
        <Route path="/payment/callback" element={<PaymentCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
