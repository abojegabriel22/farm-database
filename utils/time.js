// utils/time.js
export function getLocalTime() {
  // Get Nigerian local time as a proper Date object
  const lagosTimeString = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
  return new Date(lagosTimeString); // ✅ always a Date
}
