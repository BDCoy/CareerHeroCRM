import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  FileText,
  LogOut,
  FileText as TemplateIcon,
} from "lucide-react";
import { useCallback } from "react";
import { useSidebar } from "../contexts/SidebarContext";
import { supabase } from "../lib/supabase";

const Sidebar = () => {
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path; // Only highlight for exact /dashboard match
    }
    return location.pathname.startsWith(path); // Highlight for subpages correctly
  };

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [navigate]);

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        isActive(to) ? "bg-gray-800 text-indigo-400" : "hover:bg-gray-800"
      } ${!isOpen && "md:justify-center"}`}
      onClick={() => window.innerWidth < 768 && toggle()}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <span className={`transition-opacity duration-300 ${!isOpen && "md:hidden"}`}>
        {label}
      </span>
    </Link>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-40"
          onClick={toggle}
        />
      )}

      <button
        onClick={toggle}
        className="fixed top-4 left-4 z-50 md:hidden bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-colors duration-200 border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      <button
        onClick={toggle}
        className="fixed bottom-4 hidden md:flex items-center justify-center z-50 bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        style={{ left: isOpen ? "220px" : "12px" }}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white z-40 transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0 md:w-[68px]"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800">
            <div className={`flex items-center group ${!isOpen && "lg:justify-center"}`}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative flex items-center bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <FileText className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </div>
              <div className={`flex flex-col ml-2 ${!isOpen && "lg:hidden"}`}>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">
                  CareerHero
                </span>
                <span className="text-[8px] text-indigo-400 font-medium tracking-wider">
                  AI POWERED INSIGHTS™
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            <NavItem to="/dashboard" icon={Users} label="Customers" />
            <NavItem to="/dashboard/communications" icon={MessageSquare} label="Communications" />
            <NavItem to="/dashboard/email" icon={Mail} label="Email Center" />
            <NavItem to="/dashboard/templates" icon={TemplateIcon} label="Templates" />
            <NavItem to="/dashboard/analytics" icon={BarChart3} label="Analytics" />
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white ${
                !isOpen && "md:justify-center"
              }`}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className={`transition-opacity duration-300 ${!isOpen && "md:hidden"}`}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;