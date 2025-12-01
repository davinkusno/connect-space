"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface Ad {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  placement: "sidebar" | "banner" | "inline";
  click_count?: number;
  view_count?: number;
}

interface AdCarouselProps {
  communityId: string;
  placement: "sidebar" | "banner" | "inline";
  autoRotateInterval?: number; // in milliseconds, default 5000 (5 seconds)
}

export function AdCarousel({ 
  communityId, 
  placement, 
  autoRotateInterval = 5000 
}: AdCarouselProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const url = `/api/ads?community_id=${communityId}&placement=${placement}&active_only=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.ads && data.ads.length > 0) {
          setAds(data.ads);

          // Track views for all ads
          data.ads.forEach((ad: Ad) => {
            if (ad.id) {
              fetch(`/api/ads/${ad.id}/track`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "view" }),
              }).catch(console.error);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, [communityId, placement]);

  // Auto-rotate carousel
  useEffect(() => {
    if (!api || ads.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        // Loop back to the beginning
        api.scrollTo(0);
      }
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [api, ads.length, autoRotateInterval]);

  const handleClick = async (adId: string) => {
    // Track click
    fetch(`/api/ads/${adId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click" }),
    }).catch(console.error);
  };

  // Check if URL is a video
  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  if (isLoading || ads.length === 0) {
    return null; // Don't show anything if no ads
  }

  // If only one ad, don't use carousel
  if (ads.length === 1) {
    const ad = ads[0];
    return (
      <Card className="border-gray-200 bg-gradient-to-br from-violet-50/50 to-blue-50/50 hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Badge
                variant="secondary"
                className="bg-white/90 text-xs text-gray-600 border-0"
              >
                Advertisement
              </Badge>
            </div>
            {ad.link_url ? (
              <Link
                href={ad.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(ad.id)}
                className="block"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
                  {isVideoUrl(ad.image_url) ? (
                    <video
                      src={ad.image_url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={ad.image_url}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {ad.title}
                  </h4>
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-violet-600">
                    <span>Learn more</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ) : (
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
                  {isVideoUrl(ad.image_url) ? (
                    <video
                      src={ad.image_url}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={ad.image_url}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {ad.title}
                  </h4>
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple ads - use carousel
  return (
    <Carousel setApi={setApi} className="w-full">
      <CarouselContent>
        {ads.map((ad) => (
          <CarouselItem key={ad.id}>
            <Card className="border-gray-200 bg-gradient-to-br from-violet-50/50 to-blue-50/50 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-xs text-gray-600 border-0"
                    >
                      Advertisement
                    </Badge>
                  </div>
                  {ad.link_url ? (
                    <Link
                      href={ad.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleClick(ad.id)}
                      className="block"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={ad.image_url}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {ad.title}
                        </h4>
                        {ad.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {ad.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs text-violet-600">
                          <span>Learn more</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={ad.image_url}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {ad.title}
                        </h4>
                        {ad.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {ad.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

