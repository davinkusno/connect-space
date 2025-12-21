import { storageController } from "@/lib/controllers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  return storageController.uploadFile(request);
}

