"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  click_count?: number;
  view_count?: number;
}

interface AdDisplayProps {
  communityId: string;
  // placement removed - ads are in fixed locations
  className?: string;
}

export function AdDisplay({ communityId, className = "" }: AdDisplayProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(
          `/api/ads?community_id=${communityId}&active_only=true`
        );
        const data = await response.json();

        if (data.ads && data.ads.length > 0) {
          // Get random ad from available ads
          const randomAd = data.ads[Math.floor(Math.random() * data.ads.length)];
          setAd(randomAd);

          // Track view
          if (randomAd.id) {
            fetch(`/api/ads/${randomAd.id}/track`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "view" }),
            }).catch(console.error);
          }
        }
      } catch (error) {
        console.error("[AdDisplay] Error fetching ad:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [communityId]);

  const handleClick = async () => {
    if (ad?.id) {
      // Track click
      fetch(`/api/ads/${ad.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "click" }),
      }).catch(console.error);
    }
  };

  if (isLoading || !ad) {
    return null; // Don't show anything if no ad
  }

  const adContent = (
    <Card
      className={`border-gray-200 bg-gradient-to-br from-violet-50/50 to-blue-50/50 hover:shadow-md transition-shadow ${className}`}
    >
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
              onClick={handleClick}
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
                <div className="h-10 mb-2">
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-violet-600">
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
                <div className="h-10">
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );


  return adContent;
}


