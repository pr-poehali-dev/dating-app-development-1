import { useEffect, useState } from "react";
import { configApi, type AppBanner } from "@/lib/api";

export function MarketingBannersFeed() {
  const [banners, setBanners] = useState<AppBanner[]>([]);

  useEffect(() => {
    configApi.activeBanners().then(d => setBanners(d.banners)).catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-3 mt-2 mb-1 flex-shrink-0">
      {banners.map(b => (
        <div key={b.id} className="rounded-2xl px-4 py-3"
          style={{
            background: `linear-gradient(135deg,${b.color_from},${b.color_to})`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}>
          <p className="text-white font-black text-sm leading-tight">{b.title}</p>
          {b.subtitle && <p className="text-white/80 text-xs leading-tight mt-0.5">{b.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}

export default MarketingBannersFeed;
