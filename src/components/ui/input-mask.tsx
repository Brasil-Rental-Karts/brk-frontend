import * as React from "react";
import { Input, InputProps } from "./input";
import { MaskType } from "@/utils/masks";
import { useMask } from "@/utils/hooks/useMask";

interface InputMaskProps extends Omit<InputProps, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

export const InputMask = React.forwardRef<
  HTMLInputElement,
  InputMaskProps
>(({ mask, value, onChange, ...props }: InputMaskProps, ref) => {
  const maskProps = useMask({ mask, value, onChange });

  return <Input ref={ref} {...props} {...maskProps} />;
});

InputMask.displayName = "InputMask";
