"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Megaphone, Plus } from "lucide-react";
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
  adSubmissionFormUrl?: string; // Google Form URL for ad submissions
}

export function AdCarousel({ 
  communityId, 
  placement, 
  autoRotateInterval = 5000,
  adSubmissionFormUrl = process.env.NEXT_PUBLIC_AD_SUBMISSION_FORM_URL || "https://forms.gle/YOUR_FORM_ID" // Default from env or placeholder
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

  // Show placeholder when no ads are available
  if (!isLoading && ads.length === 0) {
    return (
      <Card className="border-gray-200 bg-gradient-to-br from-violet-50/50 to-blue-50/50 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-gradient-to-br from-violet-500 to-blue-500 p-4">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Advertise Here
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Promote your business or event to this community
              </p>
            </div>
            <Link
              href={adSubmissionFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-lg hover:from-violet-600 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Submit Your Ad</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Click to submit your advertisement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return null; // Don't show anything while loading
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

