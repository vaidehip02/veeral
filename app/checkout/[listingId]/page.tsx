export default function CheckoutPage({ params }: { params: { listingId: string } }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      {/* TODO: Order summary, Stripe Payment Element, confirm & pay */}
      <p className="text-gray-500">Checkout for listing: {params.listingId}</p>
    </div>
  );
}
