import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GiPlantSeed } from "react-icons/gi";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

interface RecommendationResult {
  recommended_crop: string;
  description: string;
}

export default function CropRecommendation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: ""
  });

  // Handle manual input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Not Logged In",
          description: "Please login to get crop recommendations.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const requestBody = {
        N: parseFloat(formData.nitrogen),
        P: parseFloat(formData.phosphorus),
        K: parseFloat(formData.potassium),
        ph: parseFloat(formData.ph)
      };

      const response = await fetch(`${API_BASE_URL}/ai/crop-recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `API error: ${response.status}`);
      }

      const data: RecommendationResult = await response.json();
      setResult(data);

      toast({
        title: "Prediction Complete! 🌱",
        description: `Recommended crop: ${data.recommended_crop}`,
      });

    } catch (error: any) {
      console.error("Error calling crop recommendation API:", error);
      toast({
        title: "Error",
        description: "Failed to get recommendation. Make sure your backend is running and JWT is valid.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { name: "nitrogen", label: "Nitrogen (N)", placeholder: "e.g., 90", unit: "kg/ha" },
    { name: "phosphorus", label: "Phosphorus (P)", placeholder: "e.g., 42", unit: "kg/ha" },
    { name: "potassium", label: "Potassium (K)", placeholder: "e.g., 43", unit: "kg/ha" },
    { name: "ph", label: "pH Value", placeholder: "e.g., 6.5", unit: "pH" }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Recommendation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Crop Recommendation System</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your soil nutrient values to get personalized crop recommendations
          </p>
        </div>

        {/* Form Card */}
        <Card className="feature-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <GiPlantSeed className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Soil Data</h2>
              <p className="text-sm text-muted-foreground">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {inputFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-base font-medium">{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      placeholder={field.placeholder}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={handleChange}
                      required
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full gradient-primary h-12 text-lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Recommendation
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Backend API:</strong> {API_BASE_URL}/ai/crop-recommendation
            </p>
          </div>
        </Card>

        {/* Results Display */}
        {result && (
          <Card className="feature-card p-8 mt-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Recommendation Result</h2>
                <p className="text-sm text-muted-foreground">AI-powered crop suggestion</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl border border-green-500/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Crop</p>
                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 capitalize">{result.recommended_crop}</h3>
              </div>

              <div className="p-6 bg-muted/50 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">AI Analysis</p>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{result.description}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
