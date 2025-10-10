import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FaLeaf, FaSeedling, FaChartLine, FaCloudSun } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function Dashboard() {
  const { user } = useUser();

  const stats = [
    {
      title: "Total Predictions",
      value: "0",
      icon: FaChartLine,
      change: "+0%",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Crop Recommendations",
      value: "0",
      icon: GiPlantSeed,
      change: "+0%",
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Disease Detections",
      value: "0",
      icon: FaLeaf,
      change: "+0%",
      color: "from-teal-500 to-cyan-600"
    },
    {
      title: "Success Rate",
      value: "0%",
      icon: TrendingUp,
      change: "+0%",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const quickActions = [
    {
      title: "Crop Recommendation",
      description: "Get AI-powered crop suggestions based on soil nutrients",
      icon: GiPlantSeed,
      link: "/crop-recommendation",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Disease Detection",
      description: "Upload plant images to detect diseases instantly",
      icon: FaLeaf,
      link: "/disease-detection",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your agricultural insights today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="feature-card hover-scale group p-8"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{action.title}</h3>
                <p className="text-muted-foreground mb-6">{action.description}</p>
                <Link to={action.link}>
                  <Button className="gradient-primary gap-2 group">
                    Get Started
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <Card className="feature-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center py-12">
            <FaCloudSun className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              No activity yet. Start by making your first prediction!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
