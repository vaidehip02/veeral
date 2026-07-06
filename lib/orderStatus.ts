export type OrderStatus =
  | "pending" | "paid" | "shipped" | "delivered"
  | "cancelled" | "refunded"
  | "return_pending" | "deposit_released" | "damage_claimed" | "deposit_resolved";

export interface StatusDisplay {
  label: string;
  bg: string;
  text: string;
}

/** Buyer order LIST — pending and paid both show "Processing" (awaiting shipment) */
export const BUYER_LIST_STATUS: Record<string, StatusDisplay> = {
  pending:          { label: "Processing",       bg: "#F5F5F5",              text: "#555"     },
  paid:             { label: "Processing",       bg: "#F5F5F5",              text: "#555"     },
  shipped:          { label: "Shipped",          bg: "#EEF2FF",              text: "#3730A3"  },
  delivered:        { label: "Delivered",        bg: "#E8F5E9",              text: "#2D6A4F"  },
  cancelled:        { label: "Cancelled",        bg: "#FEE2E2",              text: "#991B1B"  },
  refunded:         { label: "Refunded",         bg: "#EDE9FE",              text: "#5B21B6"  },
  return_pending:   { label: "Return Pending",   bg: "#FEF3C7",              text: "#92400E"  },
  deposit_released: { label: "Deposit Released", bg: "#D1FAE5",              text: "#065F46"  },
  damage_claimed:   { label: "Damage Claimed",   bg: "#FFF5F5",              text: "#991B1B"  },
  deposit_resolved: { label: "Resolved",         bg: "rgba(196,68,10,0.08)", text: "#C4440A"  },
};

/** Buyer order DETAIL — paid shows as "Paid" (payment confirmed, seller preparing shipment) */
export const BUYER_DETAIL_STATUS: Record<string, StatusDisplay> = {
  ...BUYER_LIST_STATUS,
  paid: { label: "Paid", bg: "#E3F2FD", text: "#1D4E89" },
};

/** Seller view — sale orders */
export const SELLER_SALE_STATUS: Record<string, StatusDisplay> = {
  pending:   { label: "Processing",    bg: "#F5F5F5",  text: "#555"    },
  paid:      { label: "Ready to ship", bg: "#FFF8E1",  text: "#E65100" },
  shipped:   { label: "Shipped",       bg: "#EEF2FF",  text: "#3730A3" },
  delivered: { label: "Delivered",     bg: "#E8F5E9",  text: "#2D6A4F" },
  cancelled: { label: "Cancelled",     bg: "#FEE2E2",  text: "#991B1B" },
  refunded:  { label: "Refunded",      bg: "#EDE9FE",  text: "#5B21B6" },
};

/** Seller view — rental orders */
export const SELLER_RENT_STATUS: Record<string, StatusDisplay> = {
  pending:          { label: "Processing",       bg: "#F5F5F5",  text: "#555"    },
  paid:             { label: "Ready to ship",    bg: "#FFF8E1",  text: "#E65100" },
  shipped:          { label: "Shipped",          bg: "#EEF2FF",  text: "#3730A3" },
  delivered:        { label: "Out on rental",    bg: "#E8F5E9",  text: "#2D6A4F" },
  return_pending:   { label: "Return pending",   bg: "#FEF3C7",  text: "#92400E" },
  deposit_released: { label: "Deposit released", bg: "#D1FAE5",  text: "#065F46" },
  damage_claimed:   { label: "Claim filed",      bg: "#FEF3C7",  text: "#92400E" },
  deposit_resolved: { label: "Resolved",         bg: "#EDE9FE",  text: "#5B21B6" },
  cancelled:        { label: "Cancelled",        bg: "#FEE2E2",  text: "#991B1B" },
};
