
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !city) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, city }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", name);
        // after signup, trigger verification OTP and send user to verify page
        try {
          await fetch(`${API_BASE_URL}/auth/send-verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        } catch (e) {
          // ignore; user will be able to request OTP from verify page
        }
        localStorage.setItem("verifyEmail", email);
        toast.success("Signup successful! Please verify your email.");
        navigate("/verify-email");
      } else {
        toast.error(data.error || "Signup failed");
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
        <h2 className="text-3xl font-bold mb-8 text-center">Create Account</h2>

        <form onSubmit={handleSignUp} className="space-y-5">
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            required
          />
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
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-3.5 border border-border bg-input text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition duration-200"
            required
          />

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/signin")}
            className="hover:text-primary hover:underline transition-colors duration-200"
          >
            Sign In
          </button>
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KrishiMitra. All rights reserved.
        </div>
      </div>
    </div>
  );
}
