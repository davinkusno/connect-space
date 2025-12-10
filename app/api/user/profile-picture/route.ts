import { NextRequest } from "next/server";
import { storageController } from "@/lib/controllers";

export async function POST(request: NextRequest) {
  return storageController.uploadProfilePicture(request);
}

export async function DELETE(request: NextRequest) {
  return storageController.deleteProfilePicture(request);
}
