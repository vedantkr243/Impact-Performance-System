// PrivateRoute: Protects routes that require authentication
// Unauthenticated users are redirected to login page
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth)

  // If user is authenticated, show the page
  if (token) {
    return children
  }

  // Otherwise, redirect to login
  return <Navigate to="/login" replace />
}

export default PrivateRoute