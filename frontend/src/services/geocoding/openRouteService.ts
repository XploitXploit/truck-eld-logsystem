import axios from 'axios';

// Define result interfaces to match OpenRouteService API responses
interface GeocodingFeature {
  type: string;
  geometry: {
    coordinates: number[];
    type: string;
  };
  properties: {
    id: string;
    gid: string;
    layer: string;
    source: string;
    source_id: string;
    name: string;
    housenumber?: string;
    street?: string;
    postalcode?: string;
    confidence: number;
    match_type: string;
    accuracy: string;
    country: string;
    country_gid: string;
    country_a: string;
    region?: string;
    region_gid?: string;
    region_a?: string;
    county?: string;
    county_gid?: string;
    locality?: string;
    locality_gid?: string;
    borough?: string;
    borough_gid?: string;
    label: string;
    addendum?: {
      osm?: {
        operator?: string;
      };
    };
  };
}

interface GeocodingResponse {
  geocoding: {
    version: string;
    attribution: string;
    query: {
      text: string;
      size: number;
      layers: string[];
      private: boolean;
      lang: {
        name: string;
        iso6391: string;
        iso6393: string;
        defaulted: boolean;
      };
      querySize: number;
    };
    engine: {
      name: string;
      author: string;
      version: string;
    };
    timestamp: number;
  };
  type: string;
  features: GeocodingFeature[];
  bbox: number[];
}

// You should get an API key from https://openrouteservice.org/dev/#/signup
// Store this in environment variables in a real application
const API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || 'YOUR_API_KEY';

const geocodingAPI = axios.create({
  baseURL: 'https://api.openrouteservice.org/geocode',
  headers: {
    'Authorization': API_KEY
  }
});

export const openRouteService = {
  /**
   * Search for locations based on a text query
   * @param query Text to search for (e.g. "New York")
   * @param options Additional search options
   * @returns Promise with the search results
   */
  searchLocations: async (
    query: string,
    options: {
      size?: number;
      'boundary.country'?: string;
      layers?: string;
      sources?: string;
    } = {}
  ): Promise<GeocodingFeature[]> => {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await geocodingAPI.get<GeocodingResponse>('/search', {
        params: {
          text: query,
          size: options.size || 5,
          'boundary.country': options['boundary.country'] || 'USA,CAN,MEX',
          layers: options.layers || 'locality,address',
          sources: options.sources || 'openstreetmap'
        }
      });

      return response.data.features;
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  },

  /**
   * Get location details by its ID
   * @param placeId The ID of the place to get details for
   * @returns Promise with the place details
   */
  getPlaceDetails: async (placeId: string): Promise<GeocodingFeature | null> => {
    try {
      const response = await geocodingAPI.get<GeocodingResponse>(`/lookup`, {
        params: {
          ids: placeId
        }
      });

      return response.data.features[0] || null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  },

  /**
   * Format a GeocodingFeature into a readable address string
   * @param feature The feature to format
   * @returns A formatted address string
   */
  formatAddress: (feature: GeocodingFeature): string => {
    return feature.properties.label;
  }
};

export default openRouteService;
