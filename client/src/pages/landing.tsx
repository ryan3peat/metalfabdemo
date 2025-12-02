import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  // Demo mode: Redirect to dashboard immediately
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  // Demo mode: Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
