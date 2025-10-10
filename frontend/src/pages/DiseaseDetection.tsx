import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FaLeaf } from "react-icons/fa";
import { Upload, Loader2, X, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

interface DetectionResult {
  predicted_disease: string;
  description: string;
  confidence: string;
}

// Disease detection page with image upload functionality
export default function DiseaseDetection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setFileName(file.name);
        setSelectedFile(file);
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setFileName("");
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle prediction - Call Flask backend API
  const handlePredict = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please upload a plant image first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Create FormData to send the image file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/ai/disease-detection`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: DetectionResult = await response.json();
      setResult(data);
      
      toast({
        title: "Detection Complete! 🍃",
        description: `Disease: ${data.predicted_disease} (${data.confidence})`,
      });
    } catch (error) {
      console.error("Error calling disease detection API:", error);
      toast({
        title: "Error",
        description: "Failed to detect disease. Make sure your Flask backend is running at " + API_BASE_URL,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Detection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Plant Disease Detection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image of your plant to identify diseases and get treatment recommendations
          </p>
        </div>

        {/* Upload Card */}
        <Card className="feature-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FaLeaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Upload Plant Image</h2>
              <p className="text-sm text-muted-foreground">JPG, PNG or WEBP (MAX. 10MB)</p>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-6">
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary transition-all hover:bg-muted/50"
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Click to upload image</h3>
                <p className="text-muted-foreground mb-4">or drag and drop</p>
                <Button variant="outline" type="button">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative rounded-2xl overflow-hidden border border-border">
                  <img
                    src={selectedImage}
                    alt="Selected plant"
                    className="w-full h-auto max-h-96 object-contain bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{fileName}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveImage}>
                    Remove
                  </Button>
                </div>

                {/* Predict Button */}
                <Button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full gradient-primary h-12 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Detect Disease
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Backend API:</strong> {API_BASE_URL}/ai/disease-detection
              {!API_BASE_URL.includes("127.0.0.1") && " (Set VITE_API_BASE_URL in .env to change)"}
            </p>
          </div>
        </Card>

        {/* Results Display */}
        {result && (
          <Card className="feature-card p-8 mt-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Detection Result</h2>
                <p className="text-sm text-muted-foreground">AI-powered disease analysis</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-xl border border-emerald-500/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Detected Disease</p>
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result.predicted_disease}
                  </h3>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-xl border border-blue-500/20">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Confidence Level</p>
                  <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.confidence}
                  </h3>
                </div>
              </div>

              <div className="p-6 bg-muted/50 rounded-xl border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">AI Analysis & Treatment Advice</p>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {result.description}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
