export type ListingCategory =
  | "lehenga"
  | "saree"
  | "salwar_kameez"
  | "kurta"
  | "sherwani"
  | "indo_western"
  | "jewellery"
  | "accessories"
  | "other";

export type ListingType = "sale" | "rent" | "both";

export type ListingCondition = "new" | "like_new" | "good" | "fair";

export type ListingStatus = "draft" | "active" | "sold" | "rented" | "archived";

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number; // in paise (INR) or cents (USD) — decide per market
  rent_price?: number;
  rent_duration_days?: number;
  category: ListingCategory;
  type: ListingType;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[]; // Cloudinary URLs
  size?: string;
  color?: string;
  brand?: string;
  location?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string; // matches auth.users.id
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  stripe_account_id?: string; // Stripe Connect account
  stripe_onboarding_complete: boolean;
  total_sales: number;
  rating?: number;
  created_at: string;
}

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  type: "sale" | "rent";
  amount: number;
  platform_fee: number;
  seller_payout: number;
  stripe_payment_intent_id?: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
  rental_start?: string;
  rental_end?: string;
  created_at: string;
}

export interface SavedListing {
  id: string;
  user_id: string;
  listing_id: string;
  saved_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
