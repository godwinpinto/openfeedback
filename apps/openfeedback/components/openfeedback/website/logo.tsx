"use client"
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

export const Logo = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  const {theme} = useTheme();

  return (
    <div className={cn("relative w-40 h-8", className)}>
    <Image
      src="/images/logo-full-light.png"
      alt="logo"
      fill={true}
      className="not-dark:block hidden"
    />
    <Image
      src="/images/logo-full-dark.png"
      alt="logo"
      fill={true}
      className="dark:block hidden"
    />
    </div>
  );
};

export const LogoIcon = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <Image
      src="/images/logo-full-light.png"
      width={18}
      height={18}
      alt="Picture of the author"
    />
  );
};

export const LogoStroke = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/images/logo-full-light.png"
      width={18}
      height={18}
      alt="Picture of the author"
    />
  );
};
