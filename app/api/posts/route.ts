import { NextRequest } from "next/server";
import { postController } from "@/lib/controllers";

export async function GET(request: NextRequest) {
  return postController.getAll(request);
}
