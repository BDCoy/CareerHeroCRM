import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSidebar } from "../contexts/SidebarContext";
import { supabase } from "../lib/supabase";
import CustomerList from "../pages/CustomerList";
import CustomerDetail from "../pages/CustomerDetail";
import CustomerCommunication from "../pages/CustomerCommunication";
import EmailCenter from "../pages/EmailCenter";
import Communications from "../pages/Communications";
import CommunicationDetails from "../pages/CommunicationDetails";
import EmailParser from "../pages/EmailParser";
import Dashboard from "../pages/Dashboard";
import Settings from "../pages/Settings";
import WebhookSettings from "../pages/WebhookSettings";
import BulkCommunication from "../pages/BulkCommunication";
import CustomerForm from "../pages/CustomerForm";

const Layout: React.FC = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/");
        return;
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile?.role || profile.role !== "admin") {
        await supabase.auth.signOut();
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          isOpen ? "lg:ml-[240px]" : "lg:ml-[68px]"
        }`}
      >
        <Routes>
          {/* Dashboard routes */}
          <Route path="/" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route
            path="/customers/:id/communicate"
            element={<CustomerCommunication />}
          />
          <Route path="/customers/:id/email" element={<EmailCenter />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/communications/:id" element={<CommunicationDetails />} />
          <Route path="/email" element={<EmailCenter />} />
          <Route path="/email/parser" element={<EmailParser />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/webhook-settings" element={<WebhookSettings />} />
          <Route path="/bulk-communication" element={<BulkCommunication />} />
        </Routes>
      </main>
    </div>
  );
};

export default Layout;