"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-primary mb-2">Skribbl</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to track your stats & leaderboard
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn
            routing="hash"
            forceRedirectUrl="/"
            signUpForceRedirectUrl="/"
          />
        </div>
      </div>
    </main>
  );
}
