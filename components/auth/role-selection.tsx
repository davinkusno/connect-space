"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, ArrowRight, CheckCircle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { SmoothReveal } from "@/components/ui/smooth-reveal";

interface RoleSelectionProps {
  selectedRole: "user" | "community_admin" | null;
  onRoleSelect: (role: "user" | "community_admin") => void;
  onContinue: () => void;
  isLoading: boolean;
}

export function RoleSelection({ selectedRole, onRoleSelect, onContinue, isLoading }: RoleSelectionProps) {
  const roles = [
    {
      id: "user" as const,
      title: "Community Member",
      description: "Join communities, attend events, and connect with like-minded people",
      icon: Users,
      features: [
        "Join and participate in communities",
        "Attend events and meetups",
        "Connect with other members",
        "Access community resources",
        "Receive personalized recommendations"
      ],
      badge: "Most Popular",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "community_admin" as const,
      title: "Community Admin",
      description: "Create and manage your own communities, organize events, and lead discussions",
      icon: Crown,
      features: [
        "Create and manage communities",
        "Organize events and meetups",
        "Moderate discussions",
        "Access admin analytics",
        "Invite and manage members"
      ],
      badge: "For Leaders",
      badgeColor: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="space-y-12">
      <SmoothReveal>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Choose Your Role</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Select the role that best describes how you want to use ConnectSpace. 
            You can always change this later in your settings.
          </p>
        </div>
      </SmoothReveal>

      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {roles.map((role, index) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <SmoothReveal key={role.id} delay={index * 100}>
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg h-full min-h-[400px] ${
                  isSelected 
                    ? "ring-2 ring-purple-500 shadow-lg" 
                    : "hover:shadow-md"
                }`}
                onClick={() => onRoleSelect(role.id)}
              >
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full ${
                      isSelected ? "bg-purple-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        isSelected ? "text-purple-600" : "text-gray-600"
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <CardTitle className="text-xl font-semibold">{role.title}</CardTitle>
                    <Badge className={`${role.badgeColor} text-sm px-2 py-1`}>
                      {role.badge}
                    </Badge>
                  </div>
                  
                  <CardDescription className="text-center text-base leading-relaxed px-4">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0 px-6">
                  <ul className="space-y-3">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-center gap-2 text-purple-600 font-medium text-base">
                        <CheckCircle className="h-5 w-5" />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </SmoothReveal>
          );
        })}
      </div>

      <SmoothReveal delay={400}>
        <div className="text-center">
          <AnimatedButton
            onClick={onContinue}
            disabled={!selectedRole || isLoading}
            variant="gradient"
            className="px-12 py-4 text-lg font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                Continue
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </AnimatedButton>
          
          {!selectedRole && (
            <p className="text-base text-gray-500 mt-3">
              Please select a role to continue
            </p>
          )}
        </div>
      </SmoothReveal>
    </div>
  );
}
