import Icon from "@/components/ui/icon";

const PHOTO_BACK = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/f6e87c7a-8c99-4c42-a478-32f63cadb0d8.jpg";
const PHOTO_FRONT = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/65f53640-73d5-4fab-a51a-5f8fff69172e.jpg";

// ── Мокап телефона на чистом CSS — рамка, notch, «стекло» экрана ────────────
function PhoneFrame({
  photo,
  size,
  rotate,
  z,
  offsetY = 0,
}: {
  photo: string;
  size: number;
  rotate: number;
  z: number;
  offsetY?: number;
}) {
  const width = size;
  const height = size * 2.06;

  return (
    <div
      className="absolute"
      style={{
        width,
        height,
        transform: `rotate(${rotate}deg) translateY(${offsetY}px)`,
        zIndex: z,
        filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.55))",
      }}
    >
      {/* Корпус телефона */}
      <div
        className="w-full h-full relative"
        style={{
          borderRadius: size * 0.16,
          background: "linear-gradient(160deg,#2a2438,#151022)",
          padding: size * 0.028,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Экран */}
        <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: size * 0.13 }}>
          <img src={photo} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 25%, transparent 65%, rgba(20,14,32,0.85) 100%)" }} />

          {/* Мини-интерфейс поверх фото — карточка лайка */}
          <div className="absolute left-0 right-0 bottom-0 px-[6%] pb-[6%] flex items-end justify-between">
            <div className="text-white" style={{ fontSize: size * 0.052 }}>
              <p className="font-unbounded font-black leading-none">Аня, 24</p>
              <p className="opacity-70 mt-1" style={{ fontSize: size * 0.038 }}>2 км от тебя</p>
            </div>
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                width: size * 0.15,
                height: size * 0.15,
                background: "linear-gradient(135deg, #FF2D78, #9B59B6)",
                boxShadow: "0 4px 16px rgba(255,45,120,0.5)",
              }}
            >
              <Icon name="Heart" size={size * 0.075} className="text-white" style={{ fill: "currentColor" }} />
            </div>
          </div>
        </div>

        {/* Notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
          style={{
            top: size * 0.028,
            width: size * 0.32,
            height: size * 0.055,
            background: "#151022",
            borderRadius: size * 0.04,
          }}
        />
      </div>
    </div>
  );
}

export function AuthPhonesShowcase() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 520, height: 560 }}>
      {/* Мягкое свечение позади телефонов — сливается с фоном страницы, без квадратов */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(255,45,120,0.3) 0%, rgba(155,89,182,0.17) 45%, transparent 72%)",
          filter: "blur(36px)",
        }}
      />

      <PhoneFrame photo={PHOTO_BACK} size={240} rotate={-9} z={1} offsetY={10} />
      <PhoneFrame photo={PHOTO_FRONT} size={266} rotate={7} z={2} offsetY={-6} />
    </div>
  );
}

export default AuthPhonesShowcase;