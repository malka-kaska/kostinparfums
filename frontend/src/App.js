import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Admin from "./pages/admin/Admin";
import FAQ from "./pages/FAQ";
import ShippingReturns from "./pages/ShippingReturns";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LegalInfo from "./pages/LegalInfo";
import CookiePolicy from "./pages/CookiePolicy";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import AboutUs from "./pages/AboutUs";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyOrder from "./pages/VerifyOrder";
import DubaiPerfumes from "./pages/DubaiPerfumes";
import GuestCancelOrder from "./pages/GuestCancelOrder";
import CookieBanner from "./components/CookieBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import FacebookDomainVerificationMeta from "./components/FacebookDomainVerificationMeta";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <FacebookDomainVerificationMeta />
      <BrowserRouter>
        <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
        <ScrollToTop />
        <Header />
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<ShippingReturns />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal" element={<LegalInfo />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-order" element={<VerifyOrder />} />
          <Route path="/dubai-perfumes" element={<DubaiPerfumes />} />
          <Route path="/cancel-order" element={<GuestCancelOrder />} />
          {/* Redirect /collection/dubai to /dubai-perfumes */}
          <Route path="/collection/dubai" element={<Navigate to="/dubai-perfumes" replace />} />
        </Routes>
        </ErrorBoundary>
        <Footer />
        <CookieBanner />
        <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
