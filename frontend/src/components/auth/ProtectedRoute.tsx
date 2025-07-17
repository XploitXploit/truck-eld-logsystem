import React, { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../redux/store";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading, token } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Debug logging for authentication state
  useEffect(() => {
    console.log("[ProtectedRoute] Current path:", location.pathname);
    console.log(
      "[ProtectedRoute] Auth state:",
      isAuthenticated ? "Authenticated" : "Not authenticated",
    );
    console.log("[ProtectedRoute] Loading state:", loading ? "Loading" : "Not loading");
    console.log("[ProtectedRoute] Token exists:", token ? "Yes" : "No");
    console.log("[ProtectedRoute] User:", user);
    console.log(
      "[ProtectedRoute] localStorage token:",
      localStorage.getItem("token") ? "Present" : "Not present",
    );
  }, [isAuthenticated, loading, location, token, user]);

  // Show loading indicator while authentication state is being determined
  if (loading) {
    console.log("[ProtectedRoute] Showing loading indicator");
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Not authenticated, redirecting to login");
    // Redirect to login, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin privileges if required
  if (requireAdmin && !user?.is_staff) {
    console.log("[ProtectedRoute] Admin access required but user is not staff");
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700">You don't have permission to access this page.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // If authenticated (and admin if required), render the children
  console.log("[ProtectedRoute] Authentication successful, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
