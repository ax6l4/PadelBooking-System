import { Navigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";
import { isAdmin } from "../../utils/helpers";

function AdminRoute({ children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  }

  if (!isAdmin(user)) {
    return <Navigate to="/booking" replace />;
  }

  return children;
}

export default AdminRoute;
