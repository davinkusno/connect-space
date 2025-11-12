import { createServerClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
        );
      }

      if (data.session) {
        console.log("Auth callback success:", data.user?.email);

        // Update user metadata for OAuth providers
        if (data.user && data.user.app_metadata.provider === "google") {
          const updateData = {
            full_name:
              data.user.user_metadata.full_name || data.user.user_metadata.name,
            avatar_url:
              data.user.user_metadata.avatar_url ||
              data.user.user_metadata.picture,
          };

          const { error: updateError } = await supabase.auth.updateUser({
            data: updateData,
          });

          if (updateError) {
            console.error("Error updating user metadata:", updateError);
          }
        }

        // Check user role and redirect accordingly
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          // Default to homepage if we can't fetch user data
          return NextResponse.redirect(`${origin}/`);
        }

        // Redirect based on user role and onboarding status
        const { data: userStatus } = await supabase
          .from("users")
          .select("user_type, onboarding_completed, role_selected")
          .eq("id", data.user.id)
          .single();

        const userRole = userStatus?.user_type;
        const onboardingCompleted = userStatus?.onboarding_completed;
        const roleSelected = userStatus?.role_selected;

        // Check if role is selected (for OAuth users)
        if (!roleSelected) {
          return NextResponse.redirect(`${origin}/onboarding/role`);
        }

        // Redirect based on user role
        switch (userRole) {
          case "super_admin":
            return NextResponse.redirect(`${origin}/superadmin`);
          case "community_admin":
            // Always redirect community_admin directly to community-admin page
            return NextResponse.redirect(`${origin}/community-admin`);
          case "user":
          default:
            // If onboarding not completed, go to onboarding
            if (!onboardingCompleted) {
              return NextResponse.redirect(`${origin}/onboarding`);
            }
            return NextResponse.redirect(`${origin}/`);
        }
      }
    } catch (error) {
      console.error("Unexpected auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=unexpected_error`
      );
    }
  }

  // If no code or other issues, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
