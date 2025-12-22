import { userService, UserService } from "@/lib/services";
import { ServiceResult } from "@/lib/services/base.service";
import { UserPointsSummary, UserType } from "@/lib/types";
import { LocationSearchResult } from "@/types/location";
import { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorResponse, BaseController, ForbiddenError } from "./base.controller";

// ==================== Response Types ====================

interface PointBreakdownItem {
  reason: string;
  points: number;
  created_at: string;
}

interface TransactionsResponse {
  transactions: PointBreakdownItem[];
  total: number;
}

interface OnboardingResponse {
  onboardingCompleted: boolean;
  userType: UserType | null;
  hasProfile?: boolean;
  hasInterests?: boolean;
  hasLocation?: boolean;
}

interface RoleResponse {
  user_type: UserType;
}

interface MessageResponse {
  message: string;
}

interface LocationSearchResponse {
  cities: LocationSearchResult[];
  count: number;
}

// ==================== User Controller Class ====================

/**
 * Controller for user-related API endpoints
 * Handles HTTP requests and delegates to UserService
 */
export class UserController extends BaseController {
  private readonly service: UserService;

  constructor() {
    super();
    this.service = userService;
  }

  /**
   * GET /api/user/points
   * Get current user's points summary
   * @param request - The incoming request
   * @returns NextResponse with points data
   */
  public async getPoints(
    request: NextRequest
  ): Promise<NextResponse<UserPointsSummary | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(user.id);

      if (result.success) {
        return this.json<UserPointsSummary>(result.data as UserPointsSummary, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch points", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/points
   * Get user's points by ID
   * @param request - The incoming request
   * @param userId - The user ID to fetch points for
   * @returns NextResponse with points data
   */
  public async getPointsById(
    request: NextRequest, 
    userId: string
  ): Promise<NextResponse<UserPointsSummary | ApiErrorResponse>> {
    try {
      await this.requireAuth();
      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(userId);

      if (result.success) {
        return this.json<UserPointsSummary>(result.data as UserPointsSummary, result.status);
      }
      
      return this.error(result.error?.message || "Failed to fetch points", result.status);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/[id]/transactions
   * Get user's point transactions
   * @param request - The incoming request
   * @param userId - The user ID to fetch transactions for
   * @returns NextResponse with transaction history
   */
  public async getTransactions(
    request: NextRequest, 
    userId: string
  ): Promise<NextResponse<TransactionsResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();

      // Users can only view their own transactions
      if (user.id !== userId) {
        throw new ForbiddenError("Cannot view other user's transactions");
      }

      const result: ServiceResult<UserPointsSummary> = await this.service.getPoints(userId);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch transactions", result.status);
      }

      const data: UserPointsSummary = result.data as UserPointsSummary;
      const response: TransactionsResponse = {
        transactions: [],
        total: data.activity_count || 0,
      };

      return this.json<TransactionsResponse>(response);
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/onboarding
   * Get current user's onboarding status
   * @param request - The incoming request
   * @returns NextResponse with onboarding status
   */
  public async getOnboardingStatus(
    request: NextRequest
  ): Promise<NextResponse<OnboardingResponse | ApiErrorResponse>> {
    try {
      const user: User | null = await this.getAuthenticatedUser();

      if (!user) {
        return this.json<OnboardingResponse>({ 
          onboardingCompleted: false, 
          userType: null 
        });
      }

      const result: ServiceResult<OnboardingResponse> = 
        await this.service.getOnboardingStatus(user.id);

      return this.json<OnboardingResponse>(
        result.data as OnboardingResponse, 
        result.status
      );
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/user/onboarding
   * Complete user onboarding with interests and preferences
   * @param request - The incoming request
   * @returns NextResponse indicating success
   */
  public async completeOnboarding(
    request: NextRequest
  ): Promise<NextResponse<MessageResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const body = await request.json();
      
      console.log("[UserController] Onboarding request:", {
        userId: user.id,
        interests: body.interests,
        location: body.location
      });
      
      // Extract interests and location from request body
      const { interests, location } = body;
      
      // Update user profile with interests and location if provided
      if (interests && Array.isArray(interests) && interests.length > 0) {
        console.log("[UserController] Updating profile with interests:", interests);
        
        const updateResult = await this.service.updateProfile(user.id, {
          interests,
          location: location || undefined,
        });
        
        if (!updateResult.success) {
          console.error("[UserController] Profile update failed:", updateResult.error);
          return this.error(updateResult.error?.message || "Failed to update profile", updateResult.status);
        }
        
        console.log("[UserController] Profile updated successfully");
      }
      
      // Mark onboarding as complete
      console.log("[UserController] Marking onboarding as complete");
      const result: ServiceResult<MessageResponse> = 
        await this.service.completeOnboarding(user.id);

      if (result.success) {
        console.log("[UserController] Onboarding completed successfully");
        return this.json<MessageResponse>(result.data as MessageResponse, result.status);
      }
      
      console.error("[UserController] Failed to complete onboarding:", result.error);
      return this.error(result.error?.message || "Failed to complete onboarding", result.status);
    } catch (error: unknown) {
      console.error("[UserController] Onboarding error:", error);
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/role
   * Get current user's role/type
   * @param request - The incoming request
   * @returns NextResponse with user role
   */
  public async getRole(
    request: NextRequest
  ): Promise<NextResponse<RoleResponse | ApiErrorResponse>> {
    try {
      const user: User = await this.requireAuth();
      const result: ServiceResult<{ role: UserType }> = await this.service.getRole(user.id);

      if (!result.success) {
        return this.error(result.error?.message || "Failed to fetch role", result.status);
      }

      return this.json<RoleResponse>({ 
        user_type: result.data?.role || "regular" 
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/locations/search?q=query
   * Search for cities worldwide for user profile
   * @param request - The incoming request
   * @returns NextResponse with cities list
   */
  public async searchLocations(
    request: NextRequest
  ): Promise<NextResponse<LocationSearchResponse | ApiErrorResponse>> {
    try {
      const searchParams = request.nextUrl.searchParams;
      const query = searchParams.get("q");

      // Validate query
      if (!query || query.trim().length < 3) {
        return this.error("Search query must be at least 3 characters", 400);
      }

      // Call external location API
      const result = await this.searchFromNominatim(query.trim());

      if (!result.success) {
        return this.error(result.error || "Failed to search locations", 500);
      }

      return this.json<LocationSearchResponse>({
        cities: result.data || [],
        count: result.data?.length || 0,
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/locations/reverse?lat=X&lon=Y
   * Reverse geocode coordinates to location for map clicks
   * @param request - The incoming request
   * @returns NextResponse with location data
   */
  public async reverseGeocodeLocation(
    request: NextRequest
  ): Promise<NextResponse<{ location: LocationSearchResult } | ApiErrorResponse>> {
    try {
      const searchParams = request.nextUrl.searchParams;
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");

      // Validate coordinates
      if (!lat || !lon) {
        return this.error("Latitude and longitude are required", 400);
      }

      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);

      if (isNaN(latNum) || isNaN(lonNum)) {
        return this.error("Invalid coordinates", 400);
      }

      // Call reverse geocoding
      const result = await this.reverseGeocodeFromNominatim(latNum, lonNum);

      if (!result.success) {
        return this.error(result.error || "Failed to reverse geocode", 500);
      }

      return this.json<{ location: LocationSearchResult }>({
        location: result.data!,
      });
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  /**
   * Search cities from OpenStreetMap Nominatim API
   * Private helper method for location search
   * IMPORTANT: Always uses English (accept-language: en) for consistency
   * @param query - Search query
   * @returns Service result with cities
   */
  private async searchFromNominatim(
    query: string
  ): Promise<{ success: boolean; data?: LocationSearchResult[]; error?: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}` +
          `&format=json` +
          `&limit=10` +
          `&featuretype=city` +
          `&addressdetails=1` +
          `&accept-language=en`, // Force English for consistency
        {
          headers: {
            "User-Agent": "ConnectSpace/1.0",
            "Accept-Language": "en", // Double ensure English
          },
        }
      );

      if (!response.ok) {
        console.error(`[UserController] Nominatim API error: ${response.status}`);
        return {
          success: false,
          error: "External API error",
        };
      }

      const data = await response.json();

      // Transform Nominatim results to our standardized format
      const cities: LocationSearchResult[] = data.map((item: any) => ({
        id: item.place_id.toString(),
        name:
          item.address?.city ||
          item.address?.town ||
          item.address?.municipality ||
          item.name,
        display_name: item.display_name, // Will be in English
        lat: item.lat,
        lon: item.lon,
      }));

      return {
        success: true,
        data: cities,
      };
    } catch (error) {
      console.error("[UserController] Error calling Nominatim:", error);
      return {
        success: false,
        error: "Failed to fetch locations",
      };
    }
  }

  /**
   * Reverse geocode coordinates to location
   * Private helper method for map clicks
   * IMPORTANT: Always uses English (accept-language: en) for consistency
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Service result with location
   */
  private async reverseGeocodeFromNominatim(
    lat: number,
    lon: number
  ): Promise<{ success: boolean; data?: LocationSearchResult; error?: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          `format=json` +
          `&lat=${lat}` +
          `&lon=${lon}` +
          `&addressdetails=1` +
          `&accept-language=en`, // Force English for consistency
        {
          headers: {
            "User-Agent": "ConnectSpace/1.0",
            "Accept-Language": "en", // Double ensure English
          },
        }
      );

      if (!response.ok) {
        console.error(`[UserController] Reverse geocoding error: ${response.status}`);
        return {
          success: false,
          error: "Failed to reverse geocode",
        };
      }

      const data = await response.json();

      if (!data || !data.address) {
        return {
          success: false,
          error: "No address found for coordinates",
        };
      }

      // Transform to our standardized format
      const location: LocationSearchResult = {
        id: data.place_id.toString(),
        name:
          data.address.city ||
          data.address.town ||
          data.address.municipality ||
          data.address.village ||
          "Unknown",
        display_name: data.display_name, // Will be in English
        lat: data.lat,
        lon: data.lon,
      };

      return {
        success: true,
        data: location,
      };
    } catch (error) {
      console.error("[UserController] Error reverse geocoding:", error);
      return {
        success: false,
        error: "Failed to reverse geocode",
      };
    }
  }

}

// Export singleton instance
export const userController: UserController = new UserController();
