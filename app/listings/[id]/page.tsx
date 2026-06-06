export default function ListingPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-gray-500">Listing detail page for ID: {params.id}</p>
      {/* TODO: Image gallery, title, price, seller profile snippet, buy/rent button, AI chat */}
    </div>
  );
}
