import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Filter, Search, Calendar, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserHistory() {
  const { toast } = useToast();

  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // removed "prediction"
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        setHistory(data.history || []);
        setFiltered(data.history || []);
      } catch (err) {
        toast({
          title: "Error",
          description: "Could not load history.",
          variant: "destructive",
        });
      }
    };

    fetchHistory();
  }, [toast]);

  // Filtering Logic
  useEffect(() => {
    let items = [...history];

    // Filter by type
    if (filterType !== "all") {
      items = items.filter(
        (h) => h.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Search by keyword
    if (search.trim() !== "") {
      items = items.filter(
        (h) =>
          h.type.toLowerCase().includes(search.toLowerCase()) ||
          h.result?.toLowerCase().includes(search.toLowerCase()) ||
          h.gemini_response?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by date
    items.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    setFiltered(items);
  }, [search, filterType, sortOrder, history]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7" />
            User Activity History
          </h1>
        </div>

        {/* Search + Filters */}
        <Card className="p-4 mb-6 flex flex-wrap items-center gap-4 feature-card">
          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search activity, crop, disease, Gemini response..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              className="border p-2 rounded-lg bg-background"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Crop Recommendation">Crop Recommendation</option>
              <option value="Disease Detection">Disease Detection</option>
            </select>
          </div>

          {/* Sort */}
          <Button
            variant="outline"
            onClick={() =>
              setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
            }
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        </Card>

        {/* Activity List */}
        {filtered.length > 0 ? (
          <Card className="p-6 space-y-6 feature-card">
            {filtered.map((h, index) => (
              <div
                key={index}
                className="p-4 border rounded-xl hover:bg-muted/40 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold capitalize">
                      {h.type}
                    </p>

                    {/* IMAGE PREVIEW for Disease Detection */}
                    {h.type === "Disease Detection" && h.image_url && (
                      <img
                        src={`http://127.0.0.1:5000/api/${h.image_url}`}
                        alt="Leaf"
                        className="w-32 h-32 object-cover rounded-lg border my-2"
                      />
                    )}

                    {/* Gemini Response */}
                    {h.gemini_response && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {h.gemini_response}
                      </p>
                    )}

                    {/* Result */}
                    {h.result && (
                      <p className="text-sm mt-2 font-medium">
                        Result: {h.result}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(h.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mt-3 text-lg">
              No history found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
