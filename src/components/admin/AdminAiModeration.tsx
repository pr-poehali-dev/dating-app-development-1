import { useState } from "react";
import { SectionSwitch } from "./SecurityShared";
import { AiModerationQueuePanel } from "./AiModerationQueuePanel";
import { AiModerationScanPanel } from "./AiModerationScanPanel";
import { AiModerationSettingsPanel } from "./AiModerationSettingsPanel";

export function AdminAiModeration({ token }: { token: string }) {
  const [section, setSection] = useState<"queue" | "streams" | "scan" | "settings">("queue");

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section}
        onChange={v => setSection(v as "queue" | "streams" | "scan" | "settings")}
        options={[
          { id: "queue", label: "Очередь", icon: "ListChecks" },
          { id: "streams", label: "Эфиры", icon: "Radio" },
          { id: "scan", label: "Сканирование", icon: "ScanSearch" },
          { id: "settings", label: "Настройки", icon: "Settings2" },
        ]}
      />

      {section === "settings" ? (
        <AiModerationSettingsPanel token={token} />
      ) : section === "scan" ? (
        <AiModerationScanPanel token={token} />
      ) : section === "streams" ? (
        <AiModerationQueuePanel
          token={token}
          contentType="stream"
          status="needs_review,auto_resolved"
          hideRecheck
          hideStats
          emptyText="Нарушений по эфирам нет"
        />
      ) : (
        <AiModerationQueuePanel token={token} />
      )}
    </div>
  );
}

export default AdminAiModeration;
