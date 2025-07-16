import React, { useEffect, useRef, useState } from "react";
import openRouteService from "../../services/geocoding/openRouteService";

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder: string;
  className?: string;
  required?: boolean;
}

// Using the GeocodingFeature interface from our service
interface SearchResult {
  type: string;
  geometry: {
    coordinates: number[];
    type: string;
  };
  properties: {
    id: string;
    label: string;
    name: string;
    country: string;
    region?: string;
    locality?: string;
    [key: string]: any; // Allow for other properties
  };
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder,
  className = "",
  required = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update local state when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery) return;

    setLoading(true);
    try {
      // Use our OpenRouteService API service
      const features = await openRouteService.searchLocations(searchQuery, {
        size: 5, // Number of results
        "boundary.country": "USA,CAN,MEX", // Limit to North America
      });

      setResults(features as SearchResult[]);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onChange(value);

    // Only open dropdown if we have input
    if (value.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectOption = (result: SearchResult) => {
    const selectedValue = result.properties.label;
    setQuery(selectedValue);
    onChange(selectedValue);
    onSelect(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`form-input w-full ${className}`}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        required={required}
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="animate-spin h-5 w-5 text-gray-400"
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
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {results.map((result) => (
              <li
                key={result.properties.id}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                onClick={() => handleSelectOption(result)}
              >
                {result.properties.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && query.length >= 3 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
