import GoogleAdSlot from "./GoogleAdSlot";

interface AdContainerProps {
  position: "top" | "sidebar" | "bottom";
  className?: string;
  hideAds?: boolean;
}

const POSITION_TYPE_MAP: Record<AdContainerProps["position"], Parameters<typeof GoogleAdSlot>[0]["type"]> = {
  top: "top_banner",
  sidebar: "sidebar",
  bottom: "bottom_banner",
};

export default function AdContainer({ position, className = "", hideAds = false }: AdContainerProps) {
  return (
    <div className={`rounded-3xl overflow-hidden ${className}`}>
      <GoogleAdSlot type={POSITION_TYPE_MAP[position]} hideAds={hideAds} />
    </div>
  );
}
