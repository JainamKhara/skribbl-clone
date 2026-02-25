"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ThemeProvider";

const darkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#a855f7",
    colorBackground: "#1a1228",
    colorInputBackground: "#221838",
    colorInputText: "#e8e0f0",
    colorText: "#e8e0f0",
    colorTextSecondary: "#9585a8",
    colorDanger: "#ef4444",
    borderRadius: "0.625rem" as const,
  },
  elements: {
    card: "shadow-xl border border-[#342850]",
    formButtonPrimary: "bg-[#a855f7] hover:bg-[#9333ea] text-white",
    footerActionLink: "text-[#a855f7] hover:text-[#c084fc]",
    socialButtonsBlockButton:
      "border-[#342850] text-[#e8e0f0] hover:bg-[#221838]",
    socialButtonsBlockButtonText: "text-[#e8e0f0]",
    dividerLine: "bg-[#342850]",
    dividerText: "text-[#9585a8]",
    formFieldLabel: "text-[#e8e0f0]",
    headerTitle: "text-[#e8e0f0]",
    headerSubtitle: "text-[#9585a8]",
    userButtonPopoverCard: "bg-[#1a1228] border-[#342850]",
    userButtonPopoverActionButton: "text-[#e8e0f0] hover:bg-[#221838]",
    userButtonPopoverActionButtonText: "text-[#e8e0f0]",
    userButtonPopoverFooter: "hidden",
  },
};

const lightAppearance = {
  variables: {
    colorPrimary: "#e06820",
    colorBackground: "#ffffff",
    colorInputBackground: "#faf7f2",
    colorInputText: "#1c1410",
    colorText: "#1c1410",
    colorTextSecondary: "#8a7a6a",
    colorDanger: "#dc2626",
    borderRadius: "0.625rem" as const,
  },
  elements: {
    card: "shadow-xl border border-[#e0d8ce]",
    formButtonPrimary: "bg-[#e06820] hover:bg-[#c85a1a] text-white",
    footerActionLink: "text-[#e06820] hover:text-[#c85a1a]",
    socialButtonsBlockButton:
      "border-[#e0d8ce] text-[#1c1410] hover:bg-[#f5ede3]",
    socialButtonsBlockButtonText: "text-[#1c1410]",
    dividerLine: "bg-[#e0d8ce]",
    dividerText: "text-[#8a7a6a]",
    formFieldLabel: "text-[#1c1410]",
    headerTitle: "text-[#1c1410]",
    headerSubtitle: "text-[#8a7a6a]",
    userButtonPopoverCard: "bg-white border-[#e0d8ce]",
    userButtonPopoverActionButton: "text-[#1c1410] hover:bg-[#f5ede3]",
    userButtonPopoverActionButtonText: "text-[#1c1410]",
    userButtonPopoverFooter: "hidden",
  },
};

export function ClerkThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={theme === "dark" ? darkAppearance : lightAppearance}
      allowedRedirectOrigins={[
        "http://localhost:3000",
        "https://*.trycloudflare.com",
        "*"
      ]}
    >
      {children}
    </ClerkProvider>
  );
}
