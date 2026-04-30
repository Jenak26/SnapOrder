"use client";

import { useState } from "react";
import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import UploadCard from "./_components/UploadCard";
import DemoPreview from "./_components/DemoPreview";
import RestaurantCards from "./_components/RestaurantCards";
import StickyCart from "./_components/StickyCart";
import CartSidebar from "./_components/CartSidebar";
import Features from "./_components/Features";
import Footer from "./_components/Footer";
import ChatToggleButton from "./_components/ChatToggleButton";
import ChatPanel from "./_components/ChatPanel";
import OrderTracker from "./_components/OrderTracker";
import PrivacyNotice from "./_components/PrivacyNotice";
import { useOrderStore } from "./_lib/orderStore";
import type { MatchResult, AnalyzeImageResult } from "./_lib/types";

export default function Home() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeImageResult | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const activeOrder = useOrderStore((s) => s.activeOrder);
  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);
  const clearActiveOrder = useOrderStore((s) => s.clearActiveOrder);

  const handleOrderPlaced = (orderId: string, eta: string) => {
    // Attempt to parse eta into ms, default to 35 mins
    const minsMatch = eta.match(/(\d+)/);
    const mins = minsMatch ? parseInt(minsMatch[1]) : 35;
    const estimatedDelivery = new Date(Date.now() + mins * 60000);

    setActiveOrder({
      orderId,
      estimatedDelivery,
      restaurantName: "SnapOrder Delivery", // We don't easily have the restaurant name here unless queried from cart
    });
    setChatOpen(false); // Close chat to show tracker clearly
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <UploadCard
          onResults={setMatchResults}
          onAnalysis={setAnalysis}
        />
        <DemoPreview results={matchResults} analysis={analysis} />
        <RestaurantCards analysis={analysis} />
        <Features />
      </main>
      <Footer />
      <StickyCart />
      <CartSidebar />
      <PrivacyNotice />

      {/* AI Chat Agent */}
      <ChatToggleButton 
        onClick={() => setChatOpen(true)} 
        hasAnalysisContext={!!analysis} 
      />
      <ChatPanel 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        dishAnalysis={analysis || undefined}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Live Order Tracker */}
      {activeOrder && (
        <OrderTracker 
          orderId={activeOrder.orderId}
          estimatedDelivery={activeOrder.estimatedDelivery}
          restaurantName={activeOrder.restaurantName}
          onClose={clearActiveOrder}
        />
      )}
    </>
  );
}
