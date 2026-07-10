import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID || !process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  // Let it pass build check but log a warning if envs are missing
  console.warn("Pusher environment variables are missing");
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
  useTLS: true,
});
