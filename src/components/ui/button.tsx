import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  {
    variants: {
      variant: {
        /** ปุ่มหลัก: coral */
        primary: "bg-brand text-on-brand shadow-sm shadow-brand/30 hover:brightness-95",
        /** ปุ่มรอง: น้ำเงิน */
        accent: "bg-accent text-white hover:brightness-110",
        ghost: "border border-stone-200 bg-card text-stone-700 hover:bg-stone-100",
        link: "text-stone-500 underline underline-offset-4 hover:text-ink",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-9 px-3.5 py-1.5",
        lg: "min-h-14 px-6 py-4 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type Props = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
