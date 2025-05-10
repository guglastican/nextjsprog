import Header from "@/components/Header";
import RestaurantItem from "@/components/RestaurantItem";
import { getAllTags, locations, searchRestaurants } from "@/data/restaurants";
import { Metadata } from "next";
import { cache } from "react";

interface PageProps {
  params: { location: string; q: string };
}

export const revalidate = 86400; // Refresh cached pages once every 24 hours

export async function generateStaticParams() {
  const allTags = await getAllTags({
    // If you have very many pages, you can only render a subset at compile-time. The rest will be rendered & cached at first access.
    // limit: 10
  });

  return allTags
    .map((tag) =>
      locations.map((location) => ({
        location,
        q: tag,
      })),
    )
    .flat();
}

const getRestaurants = cache(searchRestaurants);

export async function generateMetadata({
  params,
}: {
  params: { location: string; q: string };
}): Promise<Metadata> {
  const { q, location } = params;

  const qDecoded = decodeURIComponent(q);
  const locationDecoded = decodeURIComponent(location);

  const title = `Top ${qDecoded} near ${locationDecoded}`;
  const description = `Find the best ${qDecoded} near ${locationDecoded}`;

  const removeUTMParams = (url: string) => {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    return urlObj.toString();
  };

  const canonicalUrl = new URL(
    `/location/${locationDecoded}/${qDecoded}`,
    "https://example.com" // Replace with your actual base URL
  ).toString();

  const canonical = removeUTMParams(canonicalUrl);

  return {
    title,
    description,
    metadataBase: new URL("https://example.com"), // Replace with your actual base URL
    alternates: {
      canonical: canonical,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { q, location } = params;
  const qDecoded = decodeURIComponent(q);
  const locationDecoded = decodeURIComponent(location);
  const restaurants = await getRestaurants(qDecoded, locationDecoded);

  return (
    <>
      <Header q={qDecoded} location={locationDecoded} />
      <main className="container mx-auto space-y-8 px-4 py-8">
        <h1 className="text-center text-3xl font-bold">
          Top {restaurants.length} {qDecoded} near {locationDecoded}
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </main>
    </>
  );
}
