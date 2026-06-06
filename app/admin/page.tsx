export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin</h1>
      {/* TODO: Auth guard — only allow admin users (check role in Supabase) */}
      {/* TODO: Tables for listings, users, orders with moderation actions */}
      <p className="text-gray-500">Admin panel coming soon.</p>
    </div>
  );
}
