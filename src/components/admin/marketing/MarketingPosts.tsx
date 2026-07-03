import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Spinner } from "../AdminLogin";
import { adminReq, LBLOOM_ICON, type LBPost } from "./marketingShared";

export function MarketingPosts({ token }: { token: string }) {
  const [posts, setPosts] = useState<LBPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postPhotoUrl, setPostPhotoUrl] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [postSaving, setPostSaving] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [postUploading, setPostUploading] = useState(false);
  const [postUploadError, setPostUploadError] = useState("");
  const postFileRef = useRef<HTMLInputElement>(null);

  const handlePostPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPostUploadError("");
    if (!file.type.startsWith("image/")) { setPostUploadError("Выбери изображение"); return; }
    if (file.size > 10 * 1024 * 1024) { setPostUploadError("Файл слишком большой (макс. 10 МБ)"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPostUploading(true);
      try {
        const res = await adminReq(token, "admin_upload_image", { image: base64, content_type: file.type });
        if (res.ok && res.photo_url) {
          setPostPhotoUrl(res.photo_url);
        } else {
          setPostUploadError(res.error || "Ошибка загрузки");
        }
      } catch (err) {
        setPostUploadError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setPostUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadPosts = () => {
    setPostsLoading(true);
    adminReq(token, "admin_posts_list")
      .then(d => setPosts(d.posts || []))
      .finally(() => setPostsLoading(false));
  };

  const handlePostCreate = async () => {
    if (!postPhotoUrl.trim()) return;
    setPostSaving(true); setPostResult(null);
    try {
      const r = await adminReq(token, "admin_post_create", { photo_url: postPhotoUrl.trim(), caption: postCaption.trim() });
      if (r.ok) {
        setPostResult("Пост опубликован в ленте!");
        setPostPhotoUrl(""); setPostCaption("");
        loadPosts();
      } else {
        setPostResult(r.error || "Ошибка");
      }
    } finally { setPostSaving(false); }
  };

  const handlePostDelete = async (id: number) => {
    if (!confirm("Удалить пост из ленты?")) return;
    await adminReq(token, "admin_post_delete", { id });
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Форма публикации */}
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: "rgba(255,45,120,0.05)", border: "1px solid rgba(255,45,120,0.18)" }}>
        {/* Превью автора */}
        <div className="flex items-center gap-3 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <img src={LBLOOM_ICON} className="w-10 h-10 rounded-full object-cover"
            style={{ border: "2px solid rgba(255,45,120,0.5)" }} />
          <div>
            <p className="text-white font-bold text-sm">Полутон</p>
            <p className="text-white/35 text-xs">Официальный аккаунт · публикация в ленте</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Изображение</label>

          {!postPhotoUrl.trim() ? (
            <button onClick={() => postFileRef.current?.click()} disabled={postUploading}
              className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-7 transition-colors disabled:opacity-60"
              style={{ borderColor: "rgba(255,45,120,0.3)", background: "rgba(255,255,255,0.03)" }}>
              {postUploading ? (
                <>
                  <Spinner />
                  <p className="text-white/40 text-xs">Загрузка...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
                    <Icon name="ImagePlus" size={22} className="text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">Загрузить фото</p>
                  <p className="text-white/35 text-xs">JPG, PNG · макс. 10 МБ</p>
                </>
              )}
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
              <img src={postPhotoUrl.trim()} alt="preview" className="w-full object-cover" style={{ maxHeight: 240 }} />
              <button onClick={() => setPostPhotoUrl("")}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <Icon name="X" size={16} className="text-white" />
              </button>
              <button onClick={() => postFileRef.current?.click()} disabled={postUploading}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                style={{ background: "rgba(0,0,0,0.6)" }}>
                <Icon name="RefreshCw" size={13} />Заменить
              </button>
            </div>
          )}

          {postUploadError && <p className="text-red-400 text-xs mt-1">{postUploadError}</p>}
          <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={handlePostPhotoSelect} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Подпись (необязательно)</label>
          <textarea value={postCaption} onChange={e => setPostCaption(e.target.value)}
            placeholder="Текст поста от Полутон..." rows={3} maxLength={500}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
          <div className="flex justify-end">
            <span className="text-white/20 text-xs">{postCaption.length}/500</span>
          </div>
        </div>

        <button onClick={handlePostCreate} disabled={postSaving || !postPhotoUrl.trim()}
          className="py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#FF2D78,#9B59B6)" }}>
          {postSaving
            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Публикую...</>
            : <><Icon name="Send" size={15} />Опубликовать в ленте</>}
        </button>

        {postResult && (
          <div className="px-3 py-2.5 rounded-xl text-sm text-center font-semibold"
            style={{
              background: postResult.includes("Пост") ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
              color: postResult.includes("Пост") ? "#4ADE80" : "#F87171",
            }}>
            {postResult}
          </div>
        )}
      </div>

      {/* Опубликованные посты */}
      <div className="flex items-center justify-between px-1">
        <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest">Опубликованные посты</p>
        <button onClick={loadPosts} className="text-white/30 hover:text-white/60 transition-colors">
          <Icon name="RefreshCw" size={13} />
        </button>
      </div>

      {postsLoading ? <Spinner /> : posts.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <Icon name="ImageOff" size={28} className="text-white/15" />
          <p className="text-white/25 text-sm">Постов ещё нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(p => (
            <div key={p.id} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Шапка */}
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                <img src={LBLOOM_ICON} className="w-7 h-7 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-white font-semibold text-xs">LoveBloom</p>
                  <p className="text-white/30 text-[10px]">{new Date(p.created_at).toLocaleString("ru", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <button onClick={() => handlePostDelete(p.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  style={{ background: "rgba(239,68,68,0.1)" }}>
                  <Icon name="Trash2" size={12} style={{ color: "#F87171" }} />
                </button>
              </div>
              {/* Фото */}
              <img src={p.photo_url} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
              {/* Подпись + лайки */}
              <div className="px-3 py-2.5 flex items-center gap-3">
                {p.caption && <p className="text-white/70 text-xs flex-1 leading-relaxed">{p.caption}</p>}
                <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                  <Icon name="Heart" size={12} className="text-pink-400" />
                  <span className="text-white/40 text-xs">{p.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketingPosts;