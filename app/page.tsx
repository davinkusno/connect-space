"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Badge } from "@/components/ui/badge";
import { FloatingElements } from "@/components/ui/floating-elements";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getClientSession } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  // Auto-redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const session = await getClientSession();

        if (session && session.user) {
          // User is logged in, check their role
          const supabase = createClient();
          const { data: userData, error } = await supabase
            .from("users")
            .select("user_type, onboarding_completed, role_selected")
            .eq("id", session.user.id)
            .single();

          if (!error && userData) {
            const { user_type, onboarding_completed, role_selected } = userData;

            // Check role selection first (for OAuth users)
            if (!role_selected) {
              router.push("/onboarding/role");
              return;
            }

            // Redirect based on user type and onboarding status
            switch (user_type) {
              case "super_admin":
                router.push("/superadmin");
                break;
              case "community_admin":
                if (!onboarding_completed) {
                  router.push("/community-admin-registration");
                } else {
                  router.push("/community-admin");
                }
                break;
              case "user":
              default:
                if (!onboarding_completed) {
                  router.push("/onboarding");
                } else {
                  router.push("/dashboard");
                }
                break;
            }
          }
        }
        // If no session or error, stay on homepage (landing page for non-authenticated users)
      } catch (error) {
        console.error("Error checking user session:", error);
        // On error, stay on homepage
      }
    };

    checkUserAndRedirect();
  }, [router]);
  const featuredCommunities = [
    {
      id: 1,
      name: "Creative Coders",
      description:
        "A community for designers and developers who are passionate about creative coding and generative art.",
      image:
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80",
      members: 12500,
      location: "Online",
      upcomingEvents: 5,
      category: "Technology",
      tags: ["JavaScript", "p5.js", "Generative Art", "UI/UX"],
      gradient: "gradient-primary",
      growth: 15,
    },
    {
      id: 2,
      name: "Urban Gardeners",
      description:
        "Share tips, celebrate harvests, and grow together with fellow city gardening enthusiasts.",
      image:
        "https://images.unsplash.com/photo-1466692496629-3696f092c8d5?w=800&q=80",
      members: 8200,
      location: "New York",
      upcomingEvents: 3,
      category: "Gardening",
      tags: ["Balcony Gardens", "Composting", "Organic", "DIY"],
      gradient: "gradient-secondary",
      growth: 22,
    },
    {
      id: 3,
      name: "Indie Filmmakers",
      description:
        "Connect with writers, directors, and cinematographers to collaborate on independent film projects.",
      image:
        "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&q=80",
      members: 15300,
      location: "Los Angeles",
      upcomingEvents: 8,
      category: "Film",
      tags: ["Screenwriting", "Short Films", "Festivals", "Networking"],
      gradient: "gradient-tertiary",
      growth: 18,
    },
  ];

  const categories = [
    { name: "Tech", count: 1234, icon: "💻", gradient: "gradient-primary" },
    {
      name: "Art & Design",
      count: 876,
      icon: "🎨",
      gradient: "gradient-secondary",
    },
    { name: "Gaming", count: 2451, icon: "🎮", gradient: "gradient-tertiary" },
    { name: "Music", count: 1789, icon: "🎵", gradient: "gradient-quaternary" },
    { name: "Sports", count: 945, icon: "⚽", gradient: "gradient-primary" },
    {
      name: "Business",
      count: 198,
      icon: "💼",
      gradient: "gradient-secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 relative overflow-hidden">
      <FloatingElements />

      {/* Hero Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="text-gray-900">Find Your</span>
              <br />
              <span className="text-gradient">Community</span>
            </h1>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <div className="w-32 h-32 gradient-primary rounded-full opacity-20 blur-3xl floating-animation"></div>
            </div>
          </div>

          <p className="text-2xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Connect with like-minded people and discover communities that share
            your passions
          </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto mb-20 relative">
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-full p-2">
                <div className="flex items-center">
                  <Search className="absolute left-6 text-purple-600 h-6 w-6 z-10" />
                  <Input
                    placeholder="Search communities..."
                    className="pl-16 pr-6 py-6 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none"
                  />
                  <AnimatedButton
                    variant="gradient"
                    size="lg"
                    className="rounded-full"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { number: "10K+", label: "Communities", icon: "🏘️" },
              { number: "50K+", label: "Members", icon: "👥" },
              { number: "1K+", label: "Events", icon: "📅" },
            ].map((stat, index) => (
              <AnimatedCard
                key={index}
                variant="glass"
                className="p-8 text-center"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl font-bold text-gradient mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Explore Categories
            </h2>
            <p className="text-xl text-gray-600">
              Discover communities across diverse interests
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <AnimatedCard
                key={index}
                variant="3d"
                className="p-8 text-center cursor-pointer group"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm">
                  {category.count} communities
                </p>
                <div
                  className={`absolute inset-0 ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg`}
                ></div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Communities */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-20">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-4">
                Featured Communities
              </h2>
              <p className="text-xl text-gray-600">
                Join thriving communities today
              </p>
            </div>
            <Link href="/discover">
              <AnimatedButton variant="neon" size="lg" className="group">
                View All
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </AnimatedButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCommunities.map((community, index) => (
              <AnimatedCard
                key={community.id}
                variant="3d"
                className="overflow-hidden group"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={community.image || "/placeholder.svg"}
                    alt={community.name}
                    width={400}
                    height={250}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div
                    className={`absolute inset-0 ${community.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                  ></div>
                  <div className="absolute top-4 left-4">
                    <Badge className="glass-effect text-gray-800 border-0">
                      {community.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Badge className="bg-white/90 text-purple-600 border-0 font-bold">
                      +{community.growth || 12}% growth
                    </Badge>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-600 transition-colors duration-300">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {community.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {community.members.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {community.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {community.upcomingEvents}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {community.tags.map((tag, tagIndex) => (
                      <Badge
                        key={tagIndex}
                        variant="outline"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors duration-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Avatar
                          key={i}
                          className="h-10 w-10 border-3 border-white ring-2 ring-purple-100"
                        >
                          <AvatarImage
                            src={`/placeholder.svg?height=40&width=40`}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-blue-400 text-white">
                            U{i}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Link href={`/community/${community.id}`}>
                      <AnimatedButton variant="gradient" size="sm">
                        <Heart className="w-4 h-4 mr-2" />
                        Join
                      </AnimatedButton>
                    </Link>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-5xl mx-auto text-center text-white relative z-10">
          <div className="mb-8">
            <h2 className="text-6xl font-bold mb-6">
              Ready to Build Your Community?
            </h2>
            <p className="text-2xl opacity-90 leading-relaxed max-w-3xl mx-auto">
              Create your own community and bring people together around shared
              interests
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <AnimatedButton
              variant="glass"
              size="lg"
              className="text-white border-white/30"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Community
            </AnimatedButton>
            <AnimatedButton
              variant="neon"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-600"
            >
              <Search className="w-5 h-5 mr-2" />
              Explore Communities
            </AnimatedButton>
          </div>
        </div>

        {/* Floating elements in CTA */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full floating-animation"></div>
        <div
          className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-lg floating-animation"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <div className="text-2xl font-bold text-gradient">
                  ConnectSpace
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-8">
                Connecting people through shared interests and meaningful
                communities. Join thousands of communities worldwide.
              </p>
              <div className="flex space-x-4">
                {["🌟", "💫", "✨"].map((emoji, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center text-xl hover:bg-purple-600/40 transition-colors duration-300 cursor-pointer"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-6 text-xl">Platform</h3>
              <ul className="space-y-4 text-gray-300">
                {["Discover", "Events", "Create Community", "Mobile App"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-6 text-xl">Support</h3>
              <ul className="space-y-4 text-gray-300">
                {["Help Center", "Contact", "Guidelines", "Privacy"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-16 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 ConnectSpace. All rights reserved. Made with ❤️ for
              communities worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
