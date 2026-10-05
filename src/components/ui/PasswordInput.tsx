"use client";

import { ComponentProps, forwardRef, useState } from "react";
import Input from "@/components/ui/Input";
import PasswordToggleButton from "@/components/ui/PasswordToggleButton";

type Props = Omit<ComponentProps<typeof Input>, "type" | "trailing">;

/** Password field with a show/hide eye. Use one per field (e.g. password + confirm). */
const PasswordInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const [shown, setShown] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      type={shown ? "text" : "password"}
      trailing={<PasswordToggleButton shown={shown} onToggle={() => setShown((v) => !v)} />}
    />
  );
});

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
