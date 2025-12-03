import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Dummy data for ad requests (until database is populated)
const dummyAdRequests = [
  {
    id: "ad-req-001",
    user_id: "user-001",
    user_name: "John Doe",
    email: "john.doe@example.com",
    message: "I would like to advertise my tech startup on your platform. We offer innovative solutions for businesses.",
    is_read: false,
    created_at: "2025-01-15T10:30:00Z",
  },
  {
    id: "ad-req-002",
    user_id: "user-002",
    user_name: "Jane Smith",
    email: "jane.smith@example.com",
    message: "Interested in promoting our fitness app. We have a large user base and would love to partner with ConnectSpace.",
    is_read: true,
    created_at: "2025-01-14T14:20:00Z",
  },
  {
    id: "ad-req-003",
    user_id: "user-003",
    user_name: "Mike Johnson",
    email: "mike.johnson@example.com",
    message: "We are a local business looking to reach more customers through your community platform. Please contact us for advertising opportunities.",
    is_read: false,
    created_at: "2025-01-13T09:15:00Z",
  },
  {
    id: "ad-req-004",
    user_id: "user-004",
    user_name: "Sarah Williams",
    email: "sarah.williams@example.com",
    message: "Our educational platform would be a great fit for your community. We offer online courses and workshops.",
    is_read: true,
    created_at: "2025-01-12T16:45:00Z",
  },
  {
    id: "ad-req-005",
    user_id: "user-005",
    user_name: "David Brown",
    email: "david.brown@example.com",
    message: "Looking to advertise our event management services. We specialize in organizing community events and would love to collaborate.",
    is_read: false,
    created_at: "2025-01-11T11:00:00Z",
  },
];

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user is superadmin
    // For now, we'll allow any authenticated user to access this endpoint

    // Try to fetch from database first
    try {
      const { data: adRequests, error } = await supabase
        .from("ads_request")
        .select(`
          id,
          user_id,
          message,
          is_read,
          created_at,
          users (
            id,
            username,
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ad requests from database:", error);
        // Fall back to dummy data if table doesn't exist or has errors
        return NextResponse.json({ 
          data: dummyAdRequests,
          source: "dummy"
        });
      }

      if (adRequests && adRequests.length > 0) {
        // Transform database data to match expected format
        const transformedData = adRequests.map((req: any) => ({
          id: req.id,
          user_id: req.user_id,
          user_name: req.users?.full_name || req.users?.username || "Unknown User",
          email: req.users?.email || "No email",
          message: req.message || "",
          is_read: req.is_read || false,
          created_at: req.created_at,
        }));

        return NextResponse.json({ 
          data: transformedData,
          source: "database"
        });
      }

      // If no data in database, return dummy data
      return NextResponse.json({ 
        data: dummyAdRequests,
        source: "dummy"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Fall back to dummy data
      return NextResponse.json({ 
        data: dummyAdRequests,
        source: "dummy"
      });
    }
  } catch (error: any) {
    console.error("Error in ads-requests API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

