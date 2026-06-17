import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import ShippingReturns from "./pages/ShippingReturns";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import AboutUs from "./pages/AboutUs";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
        <ScrollToTop />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<ShippingReturns />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
        <Footer />
        </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
