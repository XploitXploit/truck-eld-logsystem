import React from "react";
import type { ELDGrid, TripData } from "../types/index";

interface ELDLogGridProps {
  tripData: TripData;
}

const ELDLogGrid: React.FC<ELDLogGridProps> = ({ tripData }) => {
  const eld_grids = tripData.eld_grids || [];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "off_duty":
        return "#10B981"; // green
      case "sleeper_berth":
        return "#8B5CF6"; // purple
      case "driving":
        return "#EF4444"; // red
      case "on_duty_not_driving":
        return "#F59E0B"; // yellow
      default:
        return "#6B7280"; // gray
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "off_duty":
        return "Off Duty";
      case "sleeper_berth":
        return "Sleeper Berth";
      case "driving":
        return "Driving";
      case "on_duty_not_driving":
        return "On Duty (Not Driving)";
      default:
        return status;
    }
  };

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          .remarks-section {
            break-inside: avoid;
          }
          .card {
            box-shadow: none;
            border: 1px solid #ddd;
          }
        }
      `}</style>

      {eld_grids.map((logGrid: ELDGrid, dayIndex: number) => (
        <div key={dayIndex} className="print-page">
          {/* Log Header */}
          <div className="card mb-4">
            <div className="border-2 border-black">
              {/* Title Section */}
              <div className="bg-gray-100 p-4 border-b-2 border-black">
                <div className="text-center">
                  <h2 className="text-xl font-bold">DRIVER'S DAILY LOG</h2>
                  <p className="text-sm">(ONE CALENDAR DAY — 24 HOURS)</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <p>
                      <strong>ORIGINAL</strong> — Submit to carrier within 13 days
                    </p>
                    <p>
                      <strong>DUPLICATE</strong> — Driver retains possession for eight days
                    </p>
                  </div>
                  <div className="text-right">
                    <p>
                      Date: <strong>{logGrid.date}</strong>
                    </p>
                    <p>
                      Total Miles:{" "}
                      <strong>{Math.round(tripData.total_distance / eld_grids.length)}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="grid grid-cols-2 gap-4 p-4 border-b border-black text-xs">
                <div>
                  <p className="mb-1">
                    <strong>NAME OF CARRIER:</strong> {logGrid.carrier_name}
                  </p>
                  <p className="mb-1">
                    <strong>MAIN OFFICE ADDRESS:</strong> Driver's Company Address
                  </p>
                  <p className="mb-1">
                    <strong>DRIVER'S SIGNATURE:</strong> _________________________
                  </p>
                </div>
                <div>
                  <p className="mb-1">
                    <strong>VEHICLE NUMBERS:</strong> {logGrid.truck_number}
                  </p>
                  <p className="mb-1">
                    <strong>NAME OF CO-DRIVER:</strong> _________________________
                  </p>
                  <p className="mb-1">
                    <strong>TOTAL HOURS:</strong>
                  </p>
                </div>
              </div>

              {/* Time Grid */}
              <div className="p-4">
                <div className="grid grid-cols-25 gap-0 text-xs mb-2">
                  <div className="font-bold">Status</div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className="text-center font-bold border-l border-gray-300 text-[10px]"
                    >
                      {i === 0 ? "Mid" : i === 12 ? "Noon" : i}
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                {["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"].map((status) => (
                  <div key={status} className="grid grid-cols-25 gap-0 mb-1">
                    <div className="text-[10px] font-medium py-2 pr-2 border-r border-gray-300">
                      {getStatusLabel(status)}
                    </div>
                    <div className="col-span-24 relative h-8 border border-gray-300 bg-white">
                      {/* Grid lines for hours */}
                      {Array.from({ length: 24 }, (_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-gray-200"
                          style={{ left: `${(i / 24) * 100}%` }}
                        />
                      ))}

                      {/* Activity segments */}
                      {logGrid.grid_segments
                        .filter((segment) => segment.status === status)
                        .map((segment, segIndex) => {
                          // For sleeper berth entries that extend past midnight, special handling
                          let adjustedStart = segment.start_position;
                          let adjustedWidth = segment.width;

                          // For entries that start on the current day
                          if (adjustedStart < 96) {
                            // Clamp start position to valid range (0-96)
                            adjustedStart = Math.max(0, Math.min(adjustedStart, 96));

                            // Ensure segments don't exceed the 24-hour period
                            const maxWidth = 96 - adjustedStart;
                            adjustedWidth = Math.min(adjustedWidth, maxWidth);

                            return (
                              <div
                                key={segIndex}
                                className="absolute top-0 bottom-0 opacity-80 flex items-center justify-center text-[8px] font-bold text-white truncate"
                                style={{
                                  left: `${(adjustedStart / 96) * 100}%`,
                                  width: `${(adjustedWidth / 96) * 100}%`,
                                  backgroundColor: getStatusColor(segment.status),
                                  minWidth: "2px",
                                  overflow: "hidden",
                                }}
                                title={`${segment.description} - ${segment.location}`}
                              >
                                {adjustedWidth > 8 ? segment.description.substring(0, 10) : ""}
                              </div>
                            );
                          }
                          return null; // Skip segments that start after this day
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Remarks Section */}
              <div className="p-4 border-t border-black remarks-section">
                <h4 className="font-bold text-sm mb-2">REMARKS</h4>
                <div
                  className="min-h-20 border border-gray-300 p-2 text-xs overflow-y-auto"
                  style={{ maxHeight: "200px" }}
                >
                  {logGrid.grid_segments.map((segment, index) => {
                    // Format time properly, handling 24-hour time
                    const hours = Math.floor((segment.start_position * 15) / 60);
                    const minutes = Math.floor((segment.start_position * 15) % 60);
                    const formattedHours = hours >= 24 ? hours - 24 : hours;
                    const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, "0")}`;

                    // Calculate end time for each segment
                    const endTimeMinutes = (segment.start_position + segment.width) * 15;
                    const endHours = Math.floor(endTimeMinutes / 60);
                    const endMinutes = Math.floor(endTimeMinutes % 60);
                    const formattedEndHours = endHours >= 24 ? endHours - 24 : endHours;
                    const formattedEndTime = `${formattedEndHours}:${endMinutes.toString().padStart(2, "0")}`;

                    return (
                      <p key={index} className="mb-1 text-[9px]">
                        {formattedTime} - {formattedEndTime} | {segment.location.substring(0, 15)}:{" "}
                        {segment.description}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Totals Section */}
              <div className="grid grid-cols-4 gap-4 p-4 border-t border-black text-xs font-bold">
                <div>
                  <p>
                    <strong>Off Duty:</strong> {formatTime(logGrid.totals.off_duty)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Sleeper Berth:</strong> {formatTime(logGrid.totals.sleeper_berth)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Driving:</strong> {formatTime(logGrid.totals.driving)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>On Duty (Not Driving):</strong>{" "}
                    {formatTime(logGrid.totals.on_duty_not_driving)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="card no-print">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Day {dayIndex + 1} - Detailed Activities
            </h3>

            <div className="space-y-3">
              {tripData.eld_logs[dayIndex]?.activities?.map((activity, actIndex) => (
                <div
                  key={actIndex}
                  className="flex items-center justify-between py-2 border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: getStatusColor(activity.status) }}
                    />
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-600">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {activity.start_time} - {activity.end_time}
                    </p>
                    <p className="text-sm text-gray-600">{formatTime(activity.duration)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Daily Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Driving:</p>
                  <p className="font-medium">{formatTime(logGrid.totals.driving)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total On-Duty:</p>
                  <p className="font-medium">
                    {formatTime(logGrid.totals.driving + logGrid.totals.on_duty_not_driving)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Off-Duty:</p>
                  <p className="font-medium">{formatTime(logGrid.totals.off_duty)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sleeper Berth:</p>
                  <p className="font-medium">{formatTime(logGrid.totals.sleeper_berth)}</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>
                  <strong>Note:</strong> Required rest periods extending past midnight may appear to
                  be truncated in the grid view, but are fully accounted for in the total hours.
                </p>
                <p className="mt-1">
                  <strong>Total Hours:</strong> The sum of all activity durations equals 24 hours
                  for each day.
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="card no-print">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { status: "off_duty", label: "Off Duty" },
            { status: "sleeper_berth", label: "Sleeper Berth" },
            { status: "driving", label: "Driving" },
            { status: "on_duty_not_driving", label: "On Duty (Not Driving)" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center">
              <div
                className="w-4 h-4 rounded mr-3"
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ELDLogGrid;
