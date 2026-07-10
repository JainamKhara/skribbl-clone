import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClerkThemeProvider } from "@/components/ClerkThemeProvider";

export const metadata: Metadata = {
  title: "Skribbl Clone — Draw & Guess Multiplayer Game",
  description:
    "A real-time multiplayer drawing and guessing game. Create a room, invite friends, and take turns drawing and guessing words!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ClerkThemeProvider>
            <ThemeToggle />
            {children}
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
