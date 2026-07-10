import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { getDashboardPath } from "../../utils/roles";

function OpenRoute({ children }) {
  const { token, user } = useSelector((state) => state.auth);

  // Only redirect to dashboard when both a token and user are available.
  // Prevents unintended redirects when token exists but user data hasn't been loaded.
  if (token && user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}

export default OpenRoute;
