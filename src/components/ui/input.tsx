import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full min-w-0 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none placeholder:text-stone-400 focus:border-stone-900 focus:bg-card aria-invalid:border-rose-600 aria-invalid:bg-rose-50 aria-invalid:focus:border-rose-600",
        className,
      )}
      {...props}
    />
  );
}
