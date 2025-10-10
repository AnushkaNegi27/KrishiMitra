import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaLeaf, FaSeedling, FaBrain, FaChartLine } from "react-icons/fa";
import { GiPlantSeed, GiPlantRoots } from "react-icons/gi";
import { ArrowRight, Sparkles } from "lucide-react";

// Home/Landing page component
export default function Home() {
  const features = [
    {
      icon: GiPlantSeed,
      title: "Smart Crop Recommendation",
      description: "Get AI-powered suggestions for the best crops based on your soil nutrients and environmental conditions.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: FaLeaf,
      title: "Disease Detection",
      description: "Upload plant images to instantly identify diseases and get treatment recommendations using advanced AI.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: FaBrain,
      title: "AI-Powered Insights",
      description: "Leverage machine learning models trained on extensive agricultural data for accurate predictions.",
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: FaChartLine,
      title: "Data Analytics",
      description: "Track your farming metrics and get detailed analytics to optimize your agricultural practices.",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Agricultural Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Transform Your Farming with{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                KrishiMitra
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Empower your agricultural decisions with cutting-edge AI technology. 
              Get intelligent crop recommendations and instant disease detection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/crop-recommendation">
                <Button size="lg" className="gradient-primary group gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how KrishiMitra helps farmers make smarter decisions with AI-driven insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="feature-card hover-scale group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-primary p-12 text-center text-primary-foreground">
            <div className="max-w-2xl mx-auto space-y-6">
              <FaSeedling className="h-16 w-16 mx-auto animate-float" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Revolutionize Your Farming?
              </h2>
              <p className="text-lg opacity-90">
                Join thousands of farmers who are already using KrishiMitra to improve their yields and reduce crop losses.
              </p>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
