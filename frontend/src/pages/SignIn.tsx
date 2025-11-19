
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.farmer.name);
        // if email not verified, send user to verify page
        if (data.farmer && data.farmer.email_verified === false) {
          localStorage.setItem("verifyEmail", email);
          toast("Please verify your email before continuing");
          navigate("/verify-email");
        } else {
          toast.success("Signin successful!");
          navigate("/dashboard");
        }
      } else {
        toast.error(data.error || "Signin failed");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground rounded-2xl shadow-lg border border-border animate-fade-in">
        <h2 className="text-3xl font-bold mb-8 text-center">Welcome Back</h2>

        <form onSubmit={handleSignIn} className="space-y-5">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            required
          />
          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 flex justify-between text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/forgot-password")}
            className="hover:text-primary hover:underline transition-colors duration-200"
          >
            Forgot Password?
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="hover:text-primary hover:underline transition-colors duration-200"
          >
            Create Account
          </button>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KrishiMitra. All rights reserved.
        </div>
      </div>
    </div>
  );
}
