"use client";
import Link from "next/link";
import { Logo } from "@/components/openfeedback/website/logo";
import {
  ChevronDown,
  Menu,
  Search,
  X,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import {
  Button,
} from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React, { useState } from "react";
import { Submenu, SubmenuItem } from "@/components/openfeedback/website/submenu";
import { useTheme } from "next-themes";
import { GenUIStatus } from "@/components/genui-status";

// Mobile Submenu Component
const MobileSubmenu = ({
  title,
  items,
  isOpen,
  onToggle,
  onItemClick,
}: {
  title: string;
  items: SubmenuItem[];
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: () => void;
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between pr-4 text-left text-base font-medium text-muted-foreground hover:text-accent-foreground transition-colors">
        <span>{title}</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-start gap-3 py-2 pr-6 text-sm text-muted-foreground hover:text-accent-foreground transition-colors"
            onClick={onItemClick}
          >
            <item.icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground/70 truncate">
                {item.description}
              </span>
            </div>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = React.useState<NodeJS.Timeout | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);

  const { theme, setTheme } = useTheme();

  const [openPopover, setOpenPopover] = useState<string | null>(null); // Track which popover is open by item name
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null); // Track which mobile menu is open

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmenuToggle = (menuName: string) => {
    // Clear any pending hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setOpenSubmenu(openSubmenu === menuName ? null : menuName);
  };

  const handleSubmenuClose = () => {
    console.log("handleSubmenuClose");
    // Clear any pending hover timeout
    // if (hoverTimeout) {
    //   clearTimeout(hoverTimeout);
    //   setHoverTimeout(null);
    // }
    // setOpenSubmenu(null);
    setOpenPopover(null);
  };

  const handleSubmenuHover = (menuName: string) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set a small delay before opening to prevent accidental triggers
    const timeout = setTimeout(() => {
      setOpenSubmenu(menuName);
    }, 100);

    setHoverTimeout(timeout);
  };

  const handleSubmenuHoverEnd = () => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Set a delay before closing to allow moving to submenu content
    const timeout = setTimeout(() => {
      setOpenSubmenu(null);
    }, 200);

    setHoverTimeout(timeout);
  };

  const handleMobileMenuToggle = (menuName: string) => {
    setOpenMobileMenu(openMobileMenu === menuName ? null : menuName);
  };

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex flex-col items-start gap-1 cursor-pointer"
              >
                <span className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
                  <span className="text-blue-600">O</span>pen<span className="text-blue-600">F</span>eedback
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 dark:text-gray-400">built by</span>
                  <div className="relative w-10 h-2 shrink-0">
                    <Logo className="w-10 h-2" />
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="text-xs px-3 py-1.5 h-auto"
                >
                  <Link href={process.env.NEXT_PUBLIC_GET_STARTED_URL ?? "/"}>
                    <span>Login</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <GenUIStatus 
                variant="popover"
                showErrors={false}
                showProgress={true}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className={cn(isScrolled && "lg:hidden")}
                aria-label="Toggle theme"
              >
                {mounted && theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : mounted && theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </Button>

              <Button asChild variant="default" size="sm">
                <Link href={process.env.NEXT_PUBLIC_GET_STARTED_URL ?? "/"} target="_blank">
                  <span>Visit encatch</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
