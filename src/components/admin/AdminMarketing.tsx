import { useState } from "react";
import { SectionSwitch } from "./marketing/marketingShared";
import { MarketingPush } from "./marketing/MarketingPush";
import { MarketingBanners } from "./marketing/MarketingBanners";
import { MarketingPosts } from "./marketing/MarketingPosts";

export function MarketingTab({ token }: { token: string }) {
  const [section, setSection] = useState<"push" | "banners" | "posts">("push");

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section} onChange={v => setSection(v as "push" | "banners" | "posts")}
        options={[
          { id: "push",    label: "Push-рассылка", icon: "Bell" },
          { id: "banners", label: "Баннеры",        icon: "Image" },
          { id: "posts",   label: "Посты",          icon: "Heart" },
        ]}
      />

      {section === "push" && <MarketingPush token={token} />}
      {section === "banners" && <MarketingBanners token={token} />}
      {section === "posts" && <MarketingPosts token={token} />}
    </div>
  );
}

export default MarketingTab;
