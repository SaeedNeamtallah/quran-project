import type { ReactNode } from "react";

interface InlineFootnoteProps {
  children?: ReactNode;
}

export default function InlineFootnote({ children = null }: InlineFootnoteProps) {
  return <>{children}</>;
}
