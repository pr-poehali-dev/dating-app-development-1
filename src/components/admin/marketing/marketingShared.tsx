import Icon from "@/components/ui/icon";

export type Banner = { id: number; title: string; subtitle: string; color_from: string; color_to: string; active: boolean; created_at: string };

export type LBPost = { id: number; photo_url: string; caption: string | null; created_at: string; likes: number };

export const ADMIN_URL = "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18";
export const LBLOOM_ICON = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/bucket/9a554cba-69a8-400b-aa59-3cdbaf1dc299.jpg";

export async function adminReq(token: string, action: string, body?: object) {
  const res = await fetch(`${ADMIN_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export function SectionSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={value === o.id
            ? { background: "linear-gradient(135deg,rgba(255,45,120,0.18),rgba(155,89,182,0.18))", color: "white", boxShadow: "inset 0 0 0 1px rgba(255,45,120,0.3)" }
            : { color: "rgba(255,255,255,0.35)" }}>
          <Icon name={o.icon as "Bell"} size={12} />{o.label}
        </button>
      ))}
    </div>
  );
}
