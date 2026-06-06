export default function SellerProfilePage({ params }: { params: { username: string } }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">@{params.username}</h1>
      {/* TODO: Avatar, bio, location, ratings, active listings grid */}
      <p className="text-gray-500">Seller profile coming soon.</p>
    </div>
  );
}
