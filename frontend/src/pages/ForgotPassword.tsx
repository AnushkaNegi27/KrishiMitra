
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("resetEmail", email);
        toast.success(data.message || "Reset link sent successfully!");
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground rounded-2xl shadow-lg border border-border animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
          Forgot Password
        </h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Enter your registered email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Enter your registered email"
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

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
