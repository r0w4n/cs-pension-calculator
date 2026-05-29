import type { ReactNode } from "react";

type ProjectionTableSectionContainerProps = {
  children: ReactNode;
};

export function ProjectionTableSectionContainer({
  children,
}: ProjectionTableSectionContainerProps) {
  return <>{children}</>;
}
