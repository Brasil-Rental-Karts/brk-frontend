import { Input, InputProps } from "./input";
import { MaskType } from "@/utils/masks";
import { useMask } from "@/utils/hooks/useMask";

interface InputMaskProps extends Omit<InputProps, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

export function InputMask({ mask, value, onChange, ...props }: InputMaskProps) {
  const maskProps = useMask({ mask, value, onChange });

  return <Input {...props} {...maskProps} />;
}
