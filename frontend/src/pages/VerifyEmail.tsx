import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function VerifyEmail() {
  const [email, setEmail] = useState(localStorage.getItem("verifyEmail") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email) return toast.error("Email is required");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification code sent to your email");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      setSending(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return toast.error("Email and OTP are required");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Email verified. You can now continue.");
        localStorage.removeItem("verifyEmail");
        navigate("/signin");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground rounded-2xl shadow-lg border border-border animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center">Verify your email</h2>

        <form onSubmit={verify} className="space-y-4">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            required
          />

          <div className="flex space-x-2">
            <input
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="flex-1 p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
              required
            />
            <Button type="button" onClick={sendOtp} disabled={sending} className="px-4">
              {sending ? "Sending..." : "Resend"}
            </Button>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Didn't receive the code? Click resend or check spam.
        </div>
      </div>
    </div>
  );
}
