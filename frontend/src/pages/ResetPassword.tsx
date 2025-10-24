import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token. Redirecting to Forgot Password...");
      setTimeout(() => navigate("/forgot-password"), 4000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Token check
    if (!token) {
      setError("Invalid or missing token. Redirecting...");
      setTimeout(() => navigate("/forgot-password"), 4000);
      setLoading(false);
      return;
    }

    // Password strength check
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters long and include letters, numbers, and special characters."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        navigate("/signin");
      } else {
        setError(data.message || "Something went wrong");
        // Auto-redirect if token expired
        if (data.message?.toLowerCase().includes("expired")) {
          setTimeout(() => navigate("/forgot-password"), 4000);
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    const email = localStorage.getItem("resetEmail");
    if (!email) {
      toast.error("No email stored to resend link");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.message || "Failed to resend link");
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      {error && (
        <p className={`mb-4 ${error.toLowerCase().includes("expired") ? "text-yellow-600" : "text-red-600"}`}>
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {/* Resend link button if token expired */}
      {error.toLowerCase().includes("expired") && (
        <button
          onClick={handleResendLink}
          className="mt-4 w-full text-blue-600 hover:underline"
        >
          Resend Reset Link
        </button>
      )}
    </div>
  );
}
