import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { ToolRouteSkeleton } from "@/components/tools/ux/ToolRouteSkeleton";

type Props = {
  isHome?: boolean;
};

export function RouteFallback({ isHome = false }: Props) {
  if (isHome) {
    return <HomePageSkeleton />;
  }

  return <ToolRouteSkeleton />;
}
