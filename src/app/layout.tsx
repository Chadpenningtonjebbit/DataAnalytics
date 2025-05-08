import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const workSans = Work_Sans({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-work-sans',
});

export const metadata: Metadata = {
  title: "SimpleBuilder - Interactive Quiz/Survey Builder",
  description: "Build interactive quizzes and surveys with live code editing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.className} ${workSans.variable}`}>
        <ThemeProvider defaultTheme="system" storageKey="simplebuilder-theme">
          <TooltipProvider delayDuration={300} skipDelayDuration={0}>
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
