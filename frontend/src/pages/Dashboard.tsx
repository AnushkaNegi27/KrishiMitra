import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FaLeaf, FaChartLine, FaCloudSun } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useUser();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState({
    totalPredictions: 0,
    cropRecommendations: 0,
    diseaseDetections: 0,
    successRate: 0,
    recentActivities: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Session Expired",
            description: "Please log in again to access your dashboard.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Unauthorized",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Server Error",
              description: "Failed to fetch dashboard data. Please check backend.",
              variant: "destructive",
            });
          }
          return;
        }

        const data = await response.json();

        setDashboardData({
          totalPredictions: data.totalPredictions || 0,
          cropRecommendations: data.cropRecommendations || 0,
          diseaseDetections: data.diseaseDetections || 0,
          successRate: data.successRate || 0,
          recentActivities: data.recentActivities || [],
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast({
          title: "Network Error",
          description:
            "Could not connect to backend. Ensure Flask server is running.",
          variant: "destructive",
        });
      }
    };

    fetchDashboardData();
  }, [toast]);

  const stats = [
  {
    title: "Total Predictions",
    value: dashboardData.totalPredictions,
    icon: FaChartLine,
    change:
      dashboardData.totalPredictions > 0
        ? `+${Math.min(
            (dashboardData.totalPredictions / Math.max(1, dashboardData.totalPredictions)) * 100,
            100
          ).toFixed(1)}%`
        : "+0%",
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Crop Recommendations",
    value: dashboardData.cropRecommendations,
    icon: GiPlantSeed,
    change:
      dashboardData.cropRecommendations > 0
        ? `+${((dashboardData.cropRecommendations / Math.max(1, dashboardData.totalPredictions)) * 100).toFixed(1)}%`
        : "+0%",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Disease Detections",
    value: dashboardData.diseaseDetections,
    icon: FaLeaf,
    change:
      dashboardData.diseaseDetections > 0
        ? `+${((dashboardData.diseaseDetections / Math.max(1, dashboardData.totalPredictions)) * 100).toFixed(1)}%`
        : "+0%",
    color: "from-teal-500 to-cyan-600",
  },
  {
    title: "Success Rate",
    value: `${dashboardData.successRate}%`,
    icon: TrendingUp,
    change:
      dashboardData.successRate > 0
        ? `+${(dashboardData.successRate - 90).toFixed(1)}%`
        : "+0%",
    color: "from-cyan-500 to-blue-600",
  },
];

  const quickActions = [
    {
      title: "Crop Recommendation",
      description: "Get AI-powered crop suggestions based on soil nutrients",
      icon: GiPlantSeed,
      link: "/crop-recommendation",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Disease Detection",
      description: "Upload plant images to detect diseases instantly",
      icon: FaLeaf,
      link: "/disease-detection",
      color: "from-emerald-500 to-teal-600",
    },
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
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
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
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{action.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {action.description}
                </p>
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

        {/* ✅ Recent Activity Section */}
        <Card className="feature-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>

          {dashboardData.recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {dashboardData.recentActivities.map((activity, index) => (
                <li
                  key={index}
                  className="p-4 border rounded-xl flex justify-between items-center hover:bg-muted/50 transition"
                >
                  <div>
                    <p className="font-semibold text-lg">{activity.type}</p>
                    <p className="text-muted-foreground text-sm">
                      {activity.result}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <FaCloudSun className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                No activity yet. Start by making your first prediction!
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
