import Icon from "@/components/ui/icon";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  iconClassName?: string;
}

/**
 * Универсальный аватар пользователя.
 * Если фото нет — показывает нейтральную заглушку с иконкой профиля
 * вместо стокового фото.
 */
export function UserAvatar({
  src,
  alt = "",
  className = "",
  style,
  iconSize = 24,
  iconClassName = "text-white/70",
}: UserAvatarProps) {
  if (src) {
    return <img src={src} alt={alt} className={`${className} object-cover`} style={style} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.35), rgba(155,89,182,0.35))", ...style }}
    >
      <Icon name="User" size={iconSize} className={iconClassName} />
    </div>
  );
}

export default UserAvatar;
