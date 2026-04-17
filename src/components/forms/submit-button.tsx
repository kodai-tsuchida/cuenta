"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="bg-slate-900 text-white hover:bg-slate-800"
      disabled={pending}
    >
      {pending ? "保存中..." : children}
    </Button>
  );
}
