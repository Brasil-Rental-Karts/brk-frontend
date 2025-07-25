import { Input } from "brk-design-system";
import React from "react";

import { useMask } from "@/utils/hooks/useMask";
import { MaskType } from "@/utils/masks";

interface InputMaskProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

export const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, value, onChange, ...props }: InputMaskProps, ref) => {
    const maskProps = useMask({ mask, value, onChange });

    return <Input ref={ref} {...props} {...maskProps} />;
  },
);

InputMask.displayName = "InputMask";
