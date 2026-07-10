import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    // Pusher sends URL-encoded body: socket_id=xxx&channel_name=yyy
    const text = await req.text();
    const params = new URLSearchParams(text);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return new Response("Missing socket_id or channel_name", { status: 400 });
    }

    const memberId = userId || `guest_${Math.random().toString(36).substring(2, 9)}`;
    const username = user?.username || user?.firstName || "Guest";

    const presenceData = {
      user_id: memberId,
      user_info: {
        name: username,
      },
    };

    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
