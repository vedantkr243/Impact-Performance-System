import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { ROUTES } from "../../constants/config";
import { isAdmin } from "../../utils/roles";
import PrivateRoute from "./PrivateRoute";

function AdminRoute({ children }) {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <PrivateRoute>
      {isAdmin(user) ? children : <Navigate to={ROUTES.DASHBOARD} replace />}
    </PrivateRoute>
  );
}

export default AdminRoute;
