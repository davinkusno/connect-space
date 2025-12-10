import { NextRequest } from "next/server";
import { storageController } from "@/lib/controllers";

export async function POST(request: NextRequest) {
  return storageController.uploadAdImage(request);
}
