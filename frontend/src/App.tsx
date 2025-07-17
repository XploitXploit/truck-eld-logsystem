import React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import DebugAuth from "./components/auth/DebugAuth";
import Login from "./components/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Register from "./components/auth/Register";
import Toast from "./components/common/Toast";
import Header from "./components/Header";
import TripPlanner from "./components/TripPlanner";
import TripResults from "./components/TripResults";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import "./styles/print.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Toast />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/debug" element={<DebugAuth />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <TripPlanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trip/:tripId"
                element={
                  <ProtectedRoute>
                    <TripResults />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
