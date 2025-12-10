import { useEffect, useState } from "react";
import { getDemoSession } from "@/lib/demoSession";

const SESSION_START_KEY = "demo_session_start";
const POPUP_SHOWN_KEY = "demo_popup_shown";
const POPUP_DISMISSED_AT_KEY = "demo_popup_dismissed_at";

export function useSessionTimer(thresholdMinutes = 5, reappearMinutes = 2) {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [sessionStart] = useState(() => {
    const stored = localStorage.getItem(SESSION_START_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem(SESSION_START_KEY, now.toString());
    return now;
  });

  useEffect(() => {
    const checkTimer = () => {
      const elapsed = Date.now() - sessionStart;
      const minutes = elapsed / 1000 / 60;

      const hasSubmitted = localStorage.getItem(POPUP_SHOWN_KEY) === "true";
      const dismissedAt = parseInt(localStorage.getItem(POPUP_DISMISSED_AT_KEY) || "0", 10);
      const canReappear = Date.now() - dismissedAt > reappearMinutes * 60 * 1000;

      if (!hasSubmitted && minutes >= thresholdMinutes && canReappear) {
        setShouldShowPopup(true);
      }
    };

    const interval = setInterval(checkTimer, 10000);
    checkTimer();

    return () => clearInterval(interval);
  }, [sessionStart, thresholdMinutes, reappearMinutes]);

  const dismissPopup = () => {
    setShouldShowPopup(false);
    localStorage.setItem(POPUP_DISMISSED_AT_KEY, Date.now().toString());
  };

  const markSubmitted = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, "true");
    setShouldShowPopup(false);
  };

  // Ensure demo session exists and persists session id
  useEffect(() => {
    getDemoSession();
  }, []);

  return { shouldShowPopup, dismissPopup, markSubmitted, sessionStart };
}


