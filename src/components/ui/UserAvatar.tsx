/** Аватар по умолчанию для пользователей без фото — силуэт на фирменном градиенте */
export const DEFAULT_AVATAR = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files/1ce048c9-36f3-4eb8-a0bc-4117b2b48365.jpg";

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
 * Если фото нет — показывает стандартную заглушку DEFAULT_AVATAR
 * вместо иконки профиля.
 */
export function UserAvatar({
  src,
  alt = "",
  className = "",
  style,
}: UserAvatarProps) {
  return <img src={src || DEFAULT_AVATAR} alt={alt} className={`${className} object-cover`} style={style} />;
}

export default UserAvatar;