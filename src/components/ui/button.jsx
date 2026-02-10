/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary/95 to-primary text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.15)] hover:bg-primary/90 hover:scale-[1.01] border-b-2 border-primary-700/50",
        destructive:
          "bg-gradient-to-b from-destructive/95 to-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:scale-[1.01] border-b-2 border-destructive-700/50",
        outline:
          "border border-input bg-gradient-to-b from-background to-muted/10 shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] hover:shadow-md",
        secondary:
          "bg-gradient-to-b from-secondary/95 to-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:scale-[1.01] hover:shadow-md border-b-2 border-secondary-700/20",
        white:
          "bg-white text-foreground border border-input shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.01]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-2 text-base rounded-lg",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
