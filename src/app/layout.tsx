import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css";
import SupabaseProvider from "@/components/supabase-provider";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner"
import ChannelManager from "@/components/channel-manager";

export const metadata: Metadata = {
  title: "XP",
  description: "x Playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SupabaseProvider>
              <ChannelManager>
                {children}
              </ChannelManager>
            </SupabaseProvider>
          </ThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

