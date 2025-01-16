import { tw } from "@twind/core"
import { twMerge } from "tailwind-merge"

// TODO: fix merge conflicts css resolution, the last one is not taking the precedence
export function cn(...inputs: (string | undefined | null | false)[]) {
  // First filter out falsy values
  const validInputs = inputs.filter(Boolean)
  
  // Process with Twind first
  const twindClasses = validInputs.map(input => tw(input))
  
  // Then merge with tailwind-merge to handle conflicts correctly
  return twMerge(twindClasses.join(' '))
}