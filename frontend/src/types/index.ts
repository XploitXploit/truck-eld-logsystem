export interface TripFormData {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_hours: number;
}

export interface TripData {
  trip_id: number;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_hours: number;
  total_distance: number;
  total_duration: number;
  route_geometry: any;
  eld_logs: ELDLog[];
  eld_grids: ELDGrid[];
  created_at: string;
  fuel_stops_required: number;
  fuel_stops?: GasStation[];
  violations: HOSViolation[];
  summary: TripSummary;
}

export interface GasStation {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  amenities: string[];
}

export interface ELDLog {
  date: string;
  day_number: number;
  activities: Activity[];
  daily_totals: DailyTotals;
  violations: string[];
}

export interface Activity {
  start_time: string;
  end_time: string;
  status: "off_duty" | "sleeper_berth" | "driving" | "on_duty_not_driving";
  duration: number;
  location: string;
  description: string;
}

export interface DailyTotals {
  off_duty: number;
  sleeper_berth: number;
  driving: number;
  on_duty_not_driving: number;
}

export interface ELDGrid {
  date: string;
  driver_name: string;
  carrier_name: string;
  truck_number: string;
  totals: DailyTotals;
  grid_segments: GridSegment[];
}

export interface GridSegment {
  status: "off_duty" | "sleeper_berth" | "driving" | "on_duty_not_driving";
  start_position: number;
  width: number;
  description: string;
  location: string;
}

export interface HOSViolation {
  date: string;
  type: string;
  severity: "warning" | "violation" | "critical";
  description: string;
}

export interface TripSummary {
  total_days: number;
  total_driving_time: number;
  total_duty_time: number;
  compliant: boolean;
}
