// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/ThemeToggle";

// import { FaSeedling, FaHome, FaInfoCircle } from "react-icons/fa";
// import { FaTachometerAlt, FaLeaf, FaRobot } from "react-icons/fa";
// import { GiPlantSeed } from "react-icons/gi";

// import { Menu, X, LogOut, History, ChevronDown } from "lucide-react";

// export const Navbar = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [toolsOpen, setToolsOpen] = useState(false);

//   const isActive = (path: string) => location.pathname === path;
//   const userName = localStorage.getItem("userName") || "";
//   const token = localStorage.getItem("token");

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("userName");
//     navigate("/signin");
//   };

//   return (
//     <nav className="sticky top-0 z-50 glass border-b">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between h-16 gap-8">

//           {/* Logo */}
//           <Link to="/" className="flex items-center gap-2">
//             <div className="gradient-primary p-2 rounded-xl shadow-lg">
//               <FaSeedling className="h-6 w-6 text-primary-foreground" />
//             </div>
//             <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
//               KrishiMitra
//             </span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-8">

//             {/* Home + About + Dashboard */}
//             <Link
//               to="/"
//               className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
//                 isActive("/") ? "bg-primary text-white" : "hover:bg-muted"
//               }`}
//             >
//               <FaHome className="h-4 w-4" /> Home
//             </Link>

//             <Link
//               to="/about"
//               className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
//                 isActive("/about") ? "bg-primary text-white" : "hover:bg-muted"
//               }`}
//             >
//               <FaInfoCircle className="h-4 w-4" /> About
//             </Link>

//             {token && (
//               <>
//                 <Link
//                   to="/dashboard"
//                   className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
//                     isActive("/dashboard") ? "bg-primary text-white" : "hover:bg-muted"
//                   }`}
//                 >
//                   <FaTachometerAlt className="h-4 w-4" /> Dashboard
//                 </Link>

//                 {/* 🟢 AI Tools Dropdown */}
//                 <div className="relative">
//                   <button
//                     onClick={() => setToolsOpen(!toolsOpen)}
//                     className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted"
//                   >
//                     AI Tools <ChevronDown className="h-4 w-4" />
//                   </button>

//                   {toolsOpen && (
//                     <div className="absolute left-0 mt-2 w-52 bg-white shadow-lg rounded-lg border p-2 z-50">
//                       <Link
//                         to="/crop-recommendation"
//                         className="flex gap-2 items-center px-3 py-2 rounded hover:bg-muted"
//                       >
//                         <GiPlantSeed className="h-4 w-4" /> Crop AI
//                       </Link>
//                       <Link
//                         to="/disease-detection"
//                         className="flex gap-2 items-center px-3 py-2 rounded hover:bg-muted"
//                       >
//                         <FaLeaf className="h-4 w-4" /> Disease AI
//                       </Link>
//                       <Link
//                         to="/ai-assistance"
//                         className="flex gap-2 items-center px-3 py-2 rounded hover:bg-muted"
//                       >
//                         <FaRobot className="h-4 w-4" /> Assistant
//                       </Link>
//                     </div>
//                   )}
//                 </div>

//                 {/* History Button */}
//                 <Link
//                   to="/history"
//                   className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
//                     isActive("/history")
//                       ? "bg-green-600 text-white"
//                       : "hover:bg-muted"
//                   }`}
//                 >
//                   <History className="h-4 w-4" /> History
//                 </Link>
//               </>
//             )}
//           </div>

//           {/* Right Side */}
//           <div className="flex items-center gap-4 relative">
//             <ThemeToggle />

//             {userName ? (
//               <div className="relative">
//                 <button
//                   className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold hover:scale-105 transition-transform"
//                   onClick={() => setDropdownOpen(!dropdownOpen)}
//                 >
//                   {userName
//                     .split(" ")
//                     .map((n) => n[0])
//                     .join("")
//                     .toUpperCase()}
//                 </button>

//                 {dropdownOpen && (
//                   <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 border animate-fade-in">
//                     <p className="px-4 py-2 text-sm border-b">{userName}</p>
//                     <button
//                       onClick={handleLogout}
//                       className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
//                     >
//                       <LogOut size={16} /> Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="hidden md:flex gap-2">
//                 <Link to="/signin">
//                   <Button variant="outline" size="sm">
//                     Sign In
//                   </Button>
//                 </Link>
//                 <Link to="/signup">
//                   <Button size="sm" className="gradient-primary">
//                     Sign Up
//                   </Button>
//                 </Link>
//               </div>
//             )}

//             {/* Mobile Menu Button */}
//             <button
//               className="md:hidden p-2 hover:bg-muted rounded-lg"
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             >
//               {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {mobileMenuOpen && (
//           <div className="md:hidden py-4 border-t animate-fade-in">
//             <div className="flex flex-col gap-2">

//               <Link to="/" className="px-4 py-3 hover:bg-muted rounded">Home</Link>
//               <Link to="/about" className="px-4 py-3 hover:bg-muted rounded">About</Link>

//               {token && (
//                 <>
//                   <Link to="/dashboard" className="px-4 py-3 hover:bg-muted rounded">
//                     Dashboard
//                   </Link>

//                   <Link to="/crop-recommendation" className="px-4 py-3 hover:bg-muted rounded">
//                     Crop AI
//                   </Link>

//                   <Link to="/disease-detection" className="px-4 py-3 hover:bg-muted rounded">
//                     Disease AI
//                   </Link>

//                   <Link to="/ai-assistance" className="px-4 py-3 hover:bg-muted rounded">
//                     Assistant
//                   </Link>

//                   <Link to="/history" className="px-4 py-3 hover:bg-muted rounded">
//                     History
//                   </Link>
//                 </>
//               )}

//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };











import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

import { FaSeedling, FaHome, FaInfoCircle } from "react-icons/fa";
import { FaTachometerAlt, FaLeaf, FaRobot } from "react-icons/fa";
import { GiPlantSeed } from "react-icons/gi";

import { Menu, X, LogOut, History } from "lucide-react";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const userName = localStorage.getItem("userName") || "";
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/signin");
  };

  // Links visible to everyone
  const publicLinks = [
    { path: "/", label: "Home", icon: FaHome },
    { path: "/about", label: "About", icon: FaInfoCircle },
  ];

  // Links visible only to logged-in users
  const protectedLinks = token
    ? [
        { path: "/dashboard", label: "Dashboard", icon: FaTachometerAlt },
        {
          path: "/crop-recommendation",
          label: "Crop Recommendation",
          icon: GiPlantSeed,
        },
        {
          path: "/disease-detection",
          label: "Disease Detection",
          icon: FaLeaf,
        },
        { path: "/ai-assistance", label: "AI Assistance", icon: FaRobot },

        // ⭐ NEW HISTORY PAGE LINK
        { path: "/history", label: "History", icon: History },
      ]
    : [];

  const navLinks = [...publicLinks, ...protectedLinks];

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="gradient-primary p-2 rounded-xl shadow-lg">
              <FaSeedling className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              KrishiMitra
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive(path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 relative">
            <ThemeToggle />

            {userName ? (
              <div className="relative">
                <button
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold hover:scale-105 transition-transform"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-2 border animate-fade-in">
                    <p className="px-4 py-2 text-sm text-gray-700 border-b">
                      {userName}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="gradient-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(path)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}

              {!userName && (
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Link to="/signin">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full gradient-primary">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
