import { TruckIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/store";

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <TruckIcon className="h-8 w-8" />
            <h1 className="text-2xl font-bold">TruckRoute ELD</h1>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              Plan Trip
            </Link>
            <a href="#features" className="hover:text-blue-200 transition-colors">
              Features
            </a>

            {isAuthenticated ? (
              <div className="relative z-50" ref={dropdownRef}>
                <button
                  className="flex items-center text-white hover:text-blue-200 transition-colors"
                  type="button"
                  aria-expanded={isDropdownOpen}
                  onClick={toggleDropdown}
                >
                  <UserCircleIcon className="h-6 w-6 mr-1" />
                  <span className="font-medium">{user?.username || "User"}</span>
                  <svg
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                      <div className="font-medium truncate">
                        {user?.email || "user@example.com"}
                      </div>
                      {user?.truck_id && (
                        <div className="text-gray-500">Truck ID: {user.truck_id}</div>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/trips"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Your Trips
                    </Link>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={() => dispatch(logout())}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-white hover:text-blue-200 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
        <p className="text-blue-100 mt-2">
          Professional Route Planning with HOS Compliance & ELD Logging
        </p>
      </div>
    </header>
  );
};

export default Header;
