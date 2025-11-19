import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // token invalid or server error
          setAllowed(false);
        } else {
          const data = await res.json();
          const verified = data.user?.email_verified ?? false;
          if (verified) setAllowed(true);
          else setAllowed(false);
        }
      } catch (e) {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null; // or a spinner

  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/signin" replace />;

  if (!allowed) return <Navigate to="/verify-email" replace />;

  return children;
}
