import { postController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return postController.create(request);
}
