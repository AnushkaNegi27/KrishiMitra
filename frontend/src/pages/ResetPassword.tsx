import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

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

    if (!token) {
      setError("Invalid or missing token. Redirecting...");
      setTimeout(() => navigate("/forgot-password"), 4000);
      setLoading(false);
      return;
    }

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
        if (data.message?.toLowerCase().includes("expired")) {
          setTimeout(() => navigate("/forgot-password"), 4000);
        }
      }
    } catch {
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground rounded-2xl shadow-lg border border-border animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Enter your new password below to reset your account.
        </p>

        {error && (
          <p
            className={`mb-4 text-center text-sm ${
              error.toLowerCase().includes("expired")
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="Enter new password"
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        {error.toLowerCase().includes("expired") && (
          <Button
            onClick={handleResendLink}
            variant="link"
            className="mt-4 w-full text-primary hover:underline text-sm"
          >
            Resend Reset Link
          </Button>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <a
            href="/signin"
            className="hover:text-primary hover:underline transition-colors duration-200"
          >
            Sign In
          </a>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KrishiMitra. All rights reserved.
        </div>
      </div>
    </div>
  );
}
