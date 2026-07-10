import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook for synchronized countdown timer
 * Calculates countdown from server time (draw end date)
 * All users see the same countdown, synced to server time
 * 
 * @param {Date|string} drawEndDate - The end date/time of the draw from server
 * @returns {object} Countdown object with { days, hours, minutes, seconds, isExpired }
 */
export const useDrawCountdown = (drawEndDate) => {
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    isExpired: false,
    rawDays: 0,
    rawHours: 0,
    rawMinutes: 0,
    rawSeconds: 0
  });

  const calculateCountdown = useCallback(() => {
    if (!drawEndDate) {
      return {
        days: "--",
        hours: "--",
        minutes: "--",
        seconds: "--",
        isExpired: true,
        rawDays: 0,
        rawHours: 0,
        rawMinutes: 0,
        rawSeconds: 0
      };
    }

    const targetTime = new Date(drawEndDate).getTime();
    const now = Date.now();
    const difference = targetTime - now;

    if (difference <= 0) {
      return {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
        isExpired: true,
        rawDays: 0,
        rawHours: 0,
        rawMinutes: 0,
        rawSeconds: 0
      };
    }

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
      isExpired: false,
      rawDays: days,
      rawHours: hours,
      rawMinutes: minutes,
      rawSeconds: seconds
    };
  }, [drawEndDate]);

  useEffect(() => {
    // Initial calculation
    setCountdown(calculateCountdown());

    // Set up interval to update every second
    const timerId = window.setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [drawEndDate, calculateCountdown]);

  return countdown;
};

export default useDrawCountdown;
