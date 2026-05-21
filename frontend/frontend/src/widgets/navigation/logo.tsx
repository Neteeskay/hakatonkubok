import Link from "next/link";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";

export function Logo({ size = "app" }: { size?: "app" | "landing" }) {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Помогать просто">
      <Image
        src="/logo.png"
        alt="Помогать просто"
        width={285}
        height={105}
        priority={size === "landing"}
        className={cn("h-auto w-[150px] object-contain md:w-[176px]", size === "landing" && "w-[176px] md:w-[236px]")}
      />
    </Link>
  );
}
