import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 20 Event-Focused Gamification Badges for ConnectSpace
// Points are earned ONLY from attending events
const badges = [
  // 🌟 Beginner Tier (100-300 points) - First Events
  {
    name: "Event Newbie",
    description: "Attended your very first event! Welcome to the ConnectSpace community. This is just the beginning of your journey.",
    icon: "Calendar",
    price: 100,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventnewbie&backgroundColor=b6e3f4",
    is_active: true,
  },
  {
    name: "Event Explorer",
    description: "Joined 3 different events! You're discovering what the community has to offer. Keep exploring!",
    icon: "Compass",
    price: 150,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventexplorer&backgroundColor=ffd93d",
    is_active: true,
  },
  {
    name: "Weekend Warrior",
    description: "Attended 5 events! You're making the most of your time and building meaningful connections.",
    icon: "Sun",
    price: 200,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=weekendwarrior&backgroundColor=a8e6cf",
    is_active: true,
  },
  {
    name: "Social Spark",
    description: "Joined 10 events! Your presence brings energy to every gathering. People love seeing you there!",
    icon: "Sparkles",
    price: 250,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=socialspark&backgroundColor=ff6b6b",
    is_active: true,
  },

  // 🔥 Intermediate Tier (300-600 points) - Regular Attendee
  {
    name: "Event Enthusiast",
    description: "Attended 15 events! You're becoming a familiar face in the community. Your enthusiasm is contagious!",
    icon: "Heart",
    price: 300,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=evententhusiast&backgroundColor=ffd700",
    is_active: true,
  },
  {
    name: "Networking Star",
    description: "Joined 20 events! You've met so many amazing people and created lasting connections.",
    icon: "Users",
    price: 350,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=networkingstar&backgroundColor=c7ceea",
    is_active: true,
  },
  {
    name: "Event Regular",
    description: "Attended 30 events! You're a regular at community gatherings. People look forward to seeing you!",
    icon: "UserCheck",
    price: 400,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventregular&backgroundColor=b4a7d6",
    is_active: true,
  },
  {
    name: "Community Connector",
    description: "Joined 40 events! You're the bridge that brings people together. Your network is growing strong!",
    icon: "Link",
    price: 450,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=communityconnector&backgroundColor=ff9ff3",
    is_active: true,
  },
  {
    name: "Event Champion",
    description: "Attended 50 events! You're a champion of community engagement. Your dedication inspires others!",
    icon: "Award",
    price: 500,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventchampion&backgroundColor=54a0ff",
    is_active: true,
  },
  {
    name: "Gathering Guru",
    description: "Joined 60 events! You know all the best events and never miss an opportunity to connect.",
    icon: "Star",
    price: 550,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=gatheringguru&backgroundColor=48dbfb",
    is_active: true,
  },

  // 💎 Advanced Tier (600-1000 points) - Power Attendee
  {
    name: "Event Veteran",
    description: "Attended 75 events! You're a veteran of the community scene. Your experience shows in every interaction.",
    icon: "Shield",
    price: 600,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventveteran&backgroundColor=ee5a6f",
    is_active: true,
  },
  {
    name: "Super Networker",
    description: "Joined 90 events! Your network is vast and diverse. You're a master at building relationships!",
    icon: "Network",
    price: 700,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=supernetworker&backgroundColor=f368e0",
    is_active: true,
  },
  {
    name: "Event Maestro",
    description: "Attended 100 events! A major milestone! You're a maestro of community participation.",
    icon: "Music",
    price: 750,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventmaestro&backgroundColor=00d2d3",
    is_active: true,
  },
  {
    name: "Community Pillar",
    description: "Joined 125 events! You're a pillar of this community. Your presence makes every event better!",
    icon: "Building",
    price: 800,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=communitypillar&backgroundColor=5f27cd",
    is_active: true,
  },
  {
    name: "Event Legend",
    description: "Attended 150 events! You're legendary! Your commitment to community is unmatched.",
    icon: "Zap",
    price: 900,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventlegend&backgroundColor=ff6348",
    is_active: true,
  },

  // 👑 Elite Tier (1000-2000 points) - Elite Status
  {
    name: "Platinum Attendee",
    description: "Joined 200 events! Platinum status achieved! You're in the top tier of community members.",
    icon: "Crown",
    price: 1000,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=platinumattendee&backgroundColor=ffd32a",
    is_active: true,
  },
  {
    name: "Event Ambassador",
    description: "Attended 250 events! You're an official ambassador of ConnectSpace. You represent the best of us!",
    icon: "Flag",
    price: 1200,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=eventambassador&backgroundColor=05c46b",
    is_active: true,
  },
  {
    name: "Ultimate Networker",
    description: "Joined 300 events! You're the ultimate networker. Your connections span the entire community!",
    icon: "Globe",
    price: 1500,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=ultimatenetworker&backgroundColor=ffa502",
    is_active: true,
  },

  // 🏆 Legendary Tier (2000+ points) - Hall of Fame
  {
    name: "Hall of Fame",
    description: "Attended 400+ events! You're in the Hall of Fame! Your dedication is eternal and inspiring!",
    icon: "Trophy",
    price: 2000,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=halloffame&backgroundColor=ff4757",
    is_active: true,
  },
  {
    name: "Founder's Circle",
    description: "Joined 500+ events! Ultra-exclusive! You're part of ConnectSpace history. A true legend!",
    icon: "Gem",
    price: 5000,
    image_url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=founderscircle&backgroundColor=a29bfe",
    is_active: true,
  },
];

async function seedBadges() {
  console.log("🌱 Starting badge seeding...");

  try {
    // Check if badges already exist
    const { data: existingBadges, error: fetchError } = await supabase
      .from("badges")
      .select("name");

    if (fetchError) {
      console.error("❌ Error checking existing badges:", fetchError);
      return;
    }

    if (existingBadges && existingBadges.length > 0) {
      console.log(`⚠️  Found ${existingBadges.length} existing badges.`);
      console.log("Do you want to continue? This will add new badges.");
    }

    // Insert badges
    const { data, error } = await supabase
      .from("badges")
      .insert(badges)
      .select();

    if (error) {
      console.error("❌ Error inserting badges:", error);
      return;
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} badges!`);
    console.log("\n📊 Badge Summary:");
    console.log("- Beginner Tier (100-300 pts): 4 badges");
    console.log("- Intermediate Tier (300-600 pts): 6 badges");
    console.log("- Advanced Tier (600-1000 pts): 5 badges");
    console.log("- Elite Tier (1000-2000 pts): 3 badges");
    console.log("- Legendary Tier (2000+ pts): 2 badges");
    console.log("\n🎮 Total gamification value: Excellent progression system!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the seeding function
seedBadges();
