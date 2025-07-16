import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { RegisterFormData } from "../../types";
import "./Register.css";

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    truck_id: "",
    license_number: "",
    license_expiry: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user makes a change
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.username) newErrors.username = "Username is required";
    else if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.password2) newErrors.password2 = "Please confirm your password";
    else if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Make sure date fields are in the right format
      const processedFormData = {
        ...formData,
        // Convert empty strings to null for date fields
        license_expiry: formData.license_expiry || null,
      };

      console.log("Submitting registration form:", processedFormData);
      await register(processedFormData);
      console.log("Registration successful!");
      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle validation errors from backend
      if (error.response && error.response.data) {
        if (typeof error.response.data === "string") {
          setApiError(error.response.data);
        } else {
          // Transform backend errors to match our format
          const transformedErrors: Record<string, string> = {};
          Object.entries(error.response.data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              transformedErrors[key] = value[0] as string;
            } else {
              transformedErrors[key] = value as string;
            }
          });

          setErrors(transformedErrors);

          // Also set a general error message summarizing the issues
          const firstError = Object.entries(error.response.data)
            .map(([key, value]) => {
              const errorMsg = Array.isArray(value) ? value[0] : value;
              return `${key}: ${errorMsg}`;
            })
            .join("; ");
          setApiError(firstError);
        }
      } else {
        setApiError("Registration failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 max-w-5xl mx-auto my-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-full mb-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-blue-600">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">
            Sign in
          </Link>
        </p>
      </div>

      {apiError && (
        <div className="api-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="api-error-icon"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="api-error-message">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Information Section */}
        <div>
          <h3 className="section-heading">Account Information</h3>
          <div className="form-grid form-grid-2">
            <div className="form-field">
              <label htmlFor="username" className="form-label">
                Username <span className="required">*</span>
              </label>
              <div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`form-input ${errors.username ? "error" : ""}`}
                />
                {errors.username && <p className="error-message">{errors.username}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email <span className="required">*</span>
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "error" : ""}`}
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? "error" : ""}`}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
                {errors.password && <p className="error-message">{errors.password}</p>}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="password2" className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input-container">
                <input
                  id="password2"
                  name="password2"
                  type={confirmPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  className={`form-input ${errors.password2 ? "error" : ""}`}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  {confirmPasswordVisible ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
                {errors.password2 && <p className="error-message">{errors.password2}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div>
          <h3 className="section-heading">Personal Information</h3>
          <div className="form-grid form-grid-2">
            <div className="form-field">
              <label htmlFor="first_name" className="form-label">
                First Name
              </label>
              <div>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`form-input ${errors.first_name ? "error" : ""}`}
                />
                {errors.first_name && <p className="error-message">{errors.first_name}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="last_name" className="form-label">
                Last Name
              </label>
              <div>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`form-input ${errors.last_name ? "error" : ""}`}
                />
                {errors.last_name && <p className="error-message">{errors.last_name}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="phone_number" className="form-label">
                Phone Number
              </label>
              <div>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`form-input ${errors.phone_number ? "error" : ""}`}
                />
                {errors.phone_number && <p className="error-message">{errors.phone_number}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Driver Information Section */}
        <div>
          <h3 className="section-heading">Driver Information</h3>
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label htmlFor="truck_id" className="form-label">
                Truck ID
              </label>
              <div>
                <input
                  id="truck_id"
                  name="truck_id"
                  type="text"
                  value={formData.truck_id}
                  onChange={handleChange}
                  className={`form-input ${errors.truck_id ? "error" : ""}`}
                />
                {errors.truck_id && <p className="error-message">{errors.truck_id}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="license_number" className="form-label">
                License Number
              </label>
              <div>
                <input
                  id="license_number"
                  name="license_number"
                  type="text"
                  value={formData.license_number}
                  onChange={handleChange}
                  className={`form-input ${errors.license_number ? "error" : ""}`}
                />
                {errors.license_number && <p className="error-message">{errors.license_number}</p>}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="license_expiry" className="form-label">
                License Expiry Date
              </label>
              <div>
                <input
                  id="license_expiry"
                  name="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={handleChange}
                  className={`form-input ${errors.license_expiry ? "error" : ""}`}
                />
                {errors.license_expiry && <p className="error-message">{errors.license_expiry}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6">
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? (
              <>
                <svg
                  className="spinner h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
