import { NextRequest, NextResponse } from "next/server";
import { aiClient } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const { name, interests, location } = await request.json();

    if (
      !name ||
      !interests ||
      !Array.isArray(interests) ||
      interests.length === 0
    ) {
      return NextResponse.json(
        { error: "Name and interests are required" },
        { status: 400 }
      );
    }

    const prompt = `Generate a compelling community description for a community called "${name}" based in ${
      location || "a location"
    }. 

The community focuses on these interests: ${interests.join(", ")}.

Based on the community name "${name}" and the selected interests (${interests.join(
      ", "
    )}), create a description that:
- Is engaging and welcoming (2-3 sentences, 50+ characters)
- Explains what the community offers based on the name and interests
- Mentions the types of activities members can expect
- Reflects the specific focus areas: ${interests.join(", ")}
- Is professional but friendly in tone
- Includes a call to action to join
- Uses the community name "${name}" naturally in the description

Write a description that would make people want to join this specific community.`;

    try {
      const description = await aiClient.generateText(
        `You are a community manager expert who writes compelling community descriptions that attract engaged members.\n\n${prompt}`,
        {
          systemPrompt:
            "You are a community manager expert who writes compelling community descriptions that attract engaged members.",
          maxTokens: 300,
          temperature: 0.7,
        }
      );

      if (!description) {
        throw new Error("No description generated");
      }

      return NextResponse.json({ description });
    } catch (error) {
      console.error("AI generation failed, using fallback:", error);

      // Fallback description when AI fails
      const fallbackDescription = `Welcome to ${name}! This vibrant community brings together people passionate about ${interests.join(
        ", "
      )}. 

Located in ${
        location || "our community"
      }, we organize regular meetups, workshops, and events where members can connect, learn, and grow together. Whether you're a beginner or an expert, there's something here for everyone.

Join us to share knowledge, build meaningful relationships, and be part of an amazing community that shares your interests and values. Let's create something special together!`;

      return NextResponse.json({ description: fallbackDescription });
    }
  } catch (error) {
    console.error("Error generating community description:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
