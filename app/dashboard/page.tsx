export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Active listings</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Total sales</p>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-1">Pending payout</p>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>
      {/* TODO: Connect Stripe, manage listings, orders, saved items */}
    </div>
  );
}
