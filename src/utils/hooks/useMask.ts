import { ChangeEvent } from "react";
import { MaskType, masks, maxLengths } from "../masks";

interface UseMaskProps {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

export function useMask({ mask, value, onChange }: UseMaskProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "");
    if (newValue.length <= maxLengths[mask]) {
      onChange(masks[mask](newValue));
    }
  };

  return {
    value,
    onChange: handleChange,
    inputMode: "numeric" as const,
    autoComplete: "off" as const,
  };
}
