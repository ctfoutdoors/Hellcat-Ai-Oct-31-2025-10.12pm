import { useParams } from "wouter";
import OrdersManagement from "./OrdersManagement";

/**
 * Orders filtered by channel (Website, Amazon, eBay, etc.)
 * Reuses OrdersManagement component with channel filter
 */
export default function OrdersByChannel() {
  const params = useParams();
  const channel = params.channel || "all";
  
  // Map channel slugs to display names
  const channelNames: Record<string, string> = {
    website: "Website (CTF)",
    amazon: "Amazon",
    ebay: "eBay",
    shopify: "Shopify",
    woocommerce: "WooCommerce",
    other: "Other Channels",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {channelNames[channel] || "All Orders"}
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage orders from {channelNames[channel] || "all channels"}
        </p>
      </div>
      <OrdersManagement initialChannel={channel} />
    </div>
  );
}
