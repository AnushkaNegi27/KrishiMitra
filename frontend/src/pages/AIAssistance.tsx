import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Phone, PhoneOff, Upload } from "lucide-react";
import Vapi from "@vapi-ai/web";

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;
// this api base url i added for tesing 
const API_BASE_URL = "https://nonreplicate-squamous-edie.ngrok-free.dev/api";

type VapiMessage = { type: string; [key: string]: any };
type VapiSDK = { new (publicKey: string): any; [key: string]: any };

const isUUID = (s?: string) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function AIAssistance() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vapiRef = useRef<any | null>(null);

  // Request microphone access
  useEffect(() => {
    async function requestPermissions() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        await audioCtx.resume();
        setHasPermission(true);
      } catch (err) {
        console.error("Mic permission error:", err);
        toast({
          title: "Microphone Permission Denied",
          description: "Please allow audio permissions in your browser.",
          variant: "destructive",
        });
      }
    }
    requestPermissions();
  }, [toast]);

  // Initialize Vapi SDK
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      toast({ title: "Missing VAPI Public Key", variant: "destructive" });
      return;
    }
    if (!VAPI_ASSISTANT_ID) {
      toast({ title: "Missing VAPI Assistant ID", variant: "destructive" });
      return;
    }
    if (!isUUID(VAPI_ASSISTANT_ID)) {
      toast({
        title: "Invalid Assistant ID",
        description: "Assistant ID must be a valid UUID.",
        variant: "destructive",
      });
      return;
    }

    const VapiConstructor = Vapi as VapiSDK;
    const vapi = new VapiConstructor(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    const handleCallStart = () => {
      setCallActive(true);
      toast({ title: "AI Assistance Connected" });
    };

    const handleCallEnd = () => {
      setCallActive(false);
      setUploadVisible(false);
      toast({ title: "AI Assistance Disconnected" });
    };

    const handleMessage = (msg: VapiMessage) => {
      if (msg.type === "message" && msg.role === "assistant" && msg.message) {
        const text = msg.message.toLowerCase();
        if (text.includes("upload") && (text.includes("image") || text.includes("leaf"))) {
          setUploadVisible(true);
          toast({ title: "AI requested an image upload" });
        }
      }
    };

    const handleError = (error: any) => {
      console.error("Vapi error:", error);
      toast({
        title: "Vapi Connection Error",
        description: error?.message || "An unknown Vapi error occurred.",
        variant: "destructive",
      });
      setCallActive(false);
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
      vapi.stop();
    };
  }, [toast]);

  // Start call with variable JWT token
  const handleStartCall = async () => {
    const client = vapiRef.current;
    if (!client) {
      toast({ title: "Voice Assistant not ready", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Auth Error",
        description: "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    if (!isUUID(VAPI_ASSISTANT_ID)) {
      toast({
        title: "Invalid Assistant ID",
        description: "Assistant ID must be a valid UUID.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Connecting to AI Assistant..." });

    try {
      await client.start(VAPI_ASSISTANT_ID, {
        variableValues: { USER_JWT_TOKEN: token },
      });
    } catch (err: any) {
      try {
        if (err && "status" in err && typeof err.text === "function") {
          const txt = await err.text();
          console.error("client.start Response error:", err.status, txt);
          toast({
            title: "Failed to start call",
            description: `Server error: ${err.status}`,
            variant: "destructive",
          });
        } else {
          console.error("Error during client.start:", err);
          toast({
            title: "Failed to start call",
            description: err?.message || "Check console for details.",
            variant: "destructive",
          });
        }
      } catch (readErr) {
        console.error("Error reading start error body:", readErr);
        toast({
          title: "Failed to start call",
          description: "Check console for details.",
          variant: "destructive",
        });
      }
      setCallActive(false);
    }
  };

  // End active call
  const handleEndCall = async () => {
    vapiRef.current?.stop();
  };

  // Handle file upload and send result to AI
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    toast({ title: `Uploading image "${file.name}"...` });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/ai/disease-detection`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("Backend upload failed:", response.status, txt);
        throw new Error("File upload failed");
      }

      const data = await response.json();
      toast({ title: "Analysis complete", description: "Informing AI..." });

      const analysisMessage = `The analysis is complete. Result: ${JSON.stringify(data)}`;
      vapiRef.current?.send?.({
        type: "add-message",
        role: "user",
        message: analysisMessage,
      });

      setUploadVisible(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Voice Assistant</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Agricultural Assistance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Talk to your AI farming assistant in real time for crop recommendations or disease detection.
          </p>
        </div>

        <Card className="p-8 text-center space-y-6 feature-card">
          <div className="flex flex-col items-center gap-4">
            <Button
              disabled={!hasPermission}
              onClick={callActive ? handleEndCall : handleStartCall}
              className={`w-64 h-12 text-lg ${
                callActive ? "bg-red-600 hover:bg-red-700" : "gradient-primary"
              }`}
            >
              {callActive ? (
                <>
                  <PhoneOff className="mr-2 h-5 w-5" /> End Call
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-5 w-5" /> Call to Get Assistance
                </>
              )}
            </Button>

            {!hasPermission && (
              <p className="text-sm text-muted-foreground">
                Please grant microphone access to enable the AI call.
              </p>
            )}
          </div>

          {uploadVisible && (
            <div className="mt-8 space-y-4">
              <p className="font-medium text-lg">AI requested an image upload</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedFile ? selectedFile.name : "Click to upload an image"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
