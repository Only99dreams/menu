import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AcceptInvitationBanner } from "@/components/staff/AcceptInvitationBanner";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminMenuItems from "./pages/admin/AdminMenuItems";
import ClaimAdminPage from "./pages/admin/ClaimAdminPage";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import RestaurantMenuItems from "./pages/restaurant/RestaurantMenuItems";
import RestaurantCategories from "./pages/restaurant/RestaurantCategories";
import RestaurantOrderHistory from "./pages/restaurant/RestaurantOrderHistory";
import RestaurantQRCodes from "./pages/restaurant/RestaurantQRCodes";
import RestaurantSettings from "./pages/restaurant/RestaurantSettings";
import RestaurantInventory from "./pages/restaurant/RestaurantInventory";
import RestaurantSuppliers from "./pages/restaurant/RestaurantSuppliers";
import RestaurantStaffManagement from "./pages/restaurant/RestaurantStaffManagement";
import RestaurantPurchaseOrders from "./pages/restaurant/RestaurantPurchaseOrders";
import CustomerMenu from "./pages/customer/CustomerMenu";
import ExternalCheckout from "./pages/customer/ExternalCheckout";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Global invitation banner for logged-in users */}
          <AcceptInvitationBanner />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
            
            {/* Customer Routes */}
            <Route path="/r/:restaurantSlug" element={<CustomerMenu />} />
            <Route path="/r/:restaurantSlug/checkout" element={<ExternalCheckout />} />
            
            {/* Super Admin Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/restaurants" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminRestaurants />
              </ProtectedRoute>
            } />
            <Route path="/admin/menu-items" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminMenuItems />
              </ProtectedRoute>
            } />
            <Route path="/admin/claim" element={<ClaimAdminPage />} />
            
            {/* Restaurant Dashboard Routes - Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/menu" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantMenuItems />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/categories" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantCategories />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/history" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantOrderHistory />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/qr-codes" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantQRCodes />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/inventory" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantInventory />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/suppliers" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantSuppliers />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/staff" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantStaffManagement />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/purchase-orders" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantPurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute requiredRole="restaurant_owner">
                <RestaurantSettings />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
