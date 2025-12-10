import { NextRequest } from "next/server";
import { postController } from "@/lib/controllers";

export async function POST(request: NextRequest) {
  return postController.create(request);
}
