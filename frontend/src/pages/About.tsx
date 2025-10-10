import { Card } from "@/components/ui/card";
import { FaBrain, FaLeaf, FaUsers, FaRocket } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";
import { Target, Heart, Lightbulb } from "lucide-react";

// About page component
export default function About() {
  const features = [
    {
      icon: FaBrain,
      title: "Advanced AI Models",
      description: "Utilizing state-of-the-art machine learning algorithms trained on extensive agricultural datasets for accurate predictions."
    },
    {
      icon: GiPlantSeed,
      title: "Crop Optimization",
      description: "Get personalized crop recommendations based on soil composition, climate, and environmental factors."
    },
    {
      icon: FaLeaf,
      title: "Disease Identification",
      description: "Quick and accurate plant disease detection using computer vision to help prevent crop losses."
    },
    {
      icon: FaUsers,
      title: "Farmer-Centric",
      description: "Designed with farmers in mind, providing simple and actionable insights for better decision-making."
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower farmers with cutting-edge AI technology, making precision agriculture accessible to everyone."
    },
    {
      icon: Heart,
      title: "Our Values",
      description: "We believe in sustainable farming practices, continuous innovation, and supporting agricultural communities."
    },
    {
      icon: Lightbulb,
      title: "Our Vision",
      description: "A future where every farmer has access to intelligent tools for maximizing crop yield and sustainability."
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">KrishiMitra</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            KrishiMitra is an AI-powered agricultural intelligence platform designed to help farmers make data-driven decisions. 
            We combine advanced machine learning with agricultural expertise to provide accurate crop recommendations and disease detection.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="feature-card text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission, Values, Vision */}
        <div className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="feature-card hover-scale"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="feature-card p-12 text-center">
          <FaRocket className="h-12 w-12 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Powered by AI</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            Our platform leverages machine learning models trained on thousands of agricultural data points, 
            combining soil science, climate patterns, and plant pathology to deliver accurate predictions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Machine Learning", "Computer Vision", "Data Analytics", "Cloud Computing"].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium border border-primary/20"
              >
                {tech}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
