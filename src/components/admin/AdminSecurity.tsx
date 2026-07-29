import { useState } from "react";
import { SectionSwitch } from "./SecurityShared";
import { SecurityBlockedIps } from "./SecurityBlockedIps";
import { SecurityStopwords } from "./SecurityStopwords";
import { SecurityGovRequests } from "./SecurityGovRequests";
import { SecurityEventLog } from "./SecurityEventLog";
import { SecuritySuspiciousIps } from "./SecuritySuspiciousIps";

type SecSection = "attacks" | "ips" | "words" | "gov" | "log";

export function SecurityTab({ token }: { token: string }) {
  const [section, setSection] = useState<SecSection>("attacks");

  return (
    <div className="flex flex-col gap-4">
      <SectionSwitch
        value={section}
        onChange={v => setSection(v as SecSection)}
        options={[
          { id: "attacks", label: "Атаки",   icon: "ShieldAlert" },
          { id: "ips",     label: "IP",      icon: "Shield" },
          { id: "words",   label: "Стоп",    icon: "AlertTriangle" },
          { id: "gov",     label: "Запросы", icon: "FileText" },
          { id: "log",     label: "Журнал",  icon: "Activity" },
        ]}
      />

      {section === "attacks" && <SecuritySuspiciousIps token={token} />}
      {section === "ips"     && <SecurityBlockedIps token={token} />}
      {section === "words"   && <SecurityStopwords token={token} />}
      {section === "gov"     && <SecurityGovRequests token={token} />}
      {section === "log"     && <SecurityEventLog token={token} />}
    </div>
  );
}

export default SecurityTab;