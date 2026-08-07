import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useGeoGate } from "@/hooks/useGeoGate";
import { useOneSignal } from "@/hooks/useOneSignal";
import { GeoBlockScreen } from "@/components/GeoBlockScreen";
import { PushPromptToast } from "@/components/PushPromptToast";

const queryClient = new QueryClient();

function AppInner() {
  const geoStatus = useGeoGate();
  useOneSignal();
  usePullToRefresh(() => {
    window.dispatchEvent(new CustomEvent("app:refresh"));
  });

  if (geoStatus === "blocked") return <GeoBlockScreen />;
  if (geoStatus === "checking") return null;

  return (
    <BrowserRouter>
      <PushPromptToast />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/oauth" element={<Index />} />
        <Route path="/pay/success" element={<Index />} />
        <Route path="/pay/fail" element={<Index />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/terms" element={<LegalPage tab="terms" />} />
        <Route path="/privacy" element={<LegalPage tab="privacy" />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppInner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;