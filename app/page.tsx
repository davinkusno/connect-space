"use client";

import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Badge } from "@/components/ui/badge";
import { FloatingElements } from "@/components/ui/floating-elements";
import {
    ArrowRight, Calendar,
    Compass,
    MessageCircle, Sparkles,
    Users
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {

  const categories = [
    {
      name: "Hobbies & Crafts",
      icon: "🎮",
      gradient: "gradient-primary",
    },
    { name: "Sports & Fitness", icon: "⚽", gradient: "gradient-secondary" },
    { name: "Career & Business", icon: "💼", gradient: "gradient-tertiary" },
    {
      name: "Tech & Innovation",
      icon: "💻",
      gradient: "gradient-quaternary",
    },
    {
      name: "Arts & Culture",
      icon: "🎭",
      gradient: "gradient-primary",
    },
    {
      name: "Social & Community",
      icon: "🤝",
      gradient: "gradient-secondary",
    },
    {
      name: "Education & Learning",
      icon: "📚",
      gradient: "gradient-tertiary",
    },
    {
      name: "Travel & Adventure",
      icon: "✈️",
      gradient: "gradient-quaternary",
    },
    {
      name: "Food & Drink",
      icon: "🍷",
      gradient: "gradient-primary",
    },
    {
      name: "Entertainment",
      icon: "🎉",
      gradient: "gradient-secondary",
    },
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Join Communities",
      description: "Connect with people who share your interests and passions",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Discover Events",
      description: "Find and attend events organized by communities you love",
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Engage & Discuss",
      description: "Participate in discussions and share your thoughts",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Create Your Own",
      description: "Start your own community and bring people together",
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

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/communities">
              <AnimatedButton variant="gradient" size="lg" className="group">
                <Compass className="w-5 h-5 mr-2" />
                Explore Communities
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </AnimatedButton>
            </Link>
            <Link href="/events">
              <AnimatedButton variant="glass" size="lg" className="group">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </AnimatedButton>
            </Link>
                </div>
              </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-effect border-purple-200">
              Why ConnectSpace?
            </Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Connect
            </h2>
            <p className="text-xl text-gray-600">
              Discover, join, and create communities that matter to you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard
                key={index}
                variant="glass"
                className="p-8 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-purple-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-effect border-purple-200">
              Explore Categories
            </Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Find Your Perfect Community
            </h2>
            <p className="text-xl text-gray-600">
              Browse communities by interest
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/communities?category=${encodeURIComponent(category.name)}`}
                className="group relative cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 border border-gray-100 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 text-center">
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/communities">
              <AnimatedButton variant="glass" size="lg" className="group">
                View All Communities
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </AnimatedButton>
            </Link>
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
            <Link href="/communities/create">
            <AnimatedButton
              variant="glass"
              size="lg"
              className="text-white border-white/30"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Community
            </AnimatedButton>
            </Link>
            <Link href="/communities">
            <AnimatedButton
              variant="neon"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-purple-600"
            >
                <Compass className="w-5 h-5 mr-2" />
              Explore Communities
            </AnimatedButton>
            </Link>
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
                communities. Join communities worldwide.
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
                <li>
                  <Link
                    href="/communities"
                    className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Discover
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/communities/create"
                    className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Create Community
                  </Link>
                </li>
                <li>
                      <Link
                    href="/home"
                        className="hover:text-purple-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                      >
                    Dashboard
                      </Link>
                    </li>
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
