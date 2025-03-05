import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";

import ErrorBoundary from "./components/ErrorBoundary";
import { SidebarProvider } from "./contexts/SidebarContext";
import SignIn from "./pages/SignIn";

function App() {
  return (
    <SidebarProvider>
      <Router>
        <Toaster position="top-right" />
        <ErrorBoundary>
          <Routes>
            {/* Public route */}
            <Route path="/" element={<SignIn />} />
            <Route path="/dashboard/*" element={<Layout />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </SidebarProvider>
  );
}

export default App;
