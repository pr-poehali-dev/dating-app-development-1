/**
 * Живые SVG-персонажи подарков. У каждого независимо двигаются части
 * (лепестки, лапки, блики, грани, крылья), а форма и декор меняются
 * по variant — от простых до легендарных. Работает офлайн, без внешних файлов.
 *
 * Файл-фасад: общие keyframes/палитры/декор вынесены в giftScenesShared.tsx,
 * сцены с вариантами редкости — в GiftScenesPrimary.tsx, специальные сцены
 * без вариантов — в GiftScenesSpecial.tsx.
 */
import { GIFT_SCENE_KEYFRAMES } from "./giftScenesShared";
import { HeartScene, RoseScene, BearScene, RingScene } from "./GiftScenesPrimary";
import { DogScene, CatScene, RabbitScene, RocketScene, UnicornScene, StarScene, CrownScene, DragonScene } from "./GiftScenesSpecial";

export { GIFT_SCENE_KEYFRAMES };
export { HeartScene, RoseScene, BearScene, RingScene };
export { DogScene, CatScene, RabbitScene, RocketScene, UnicornScene, StarScene, CrownScene, DragonScene };

export type GiftSceneCategory = "heart" | "rose" | "bear" | "ring" | "special";

const SPECIAL_SCENES = [DogScene, CatScene, RabbitScene, RocketScene, UnicornScene, StarScene, CrownScene, DragonScene];

export function GiftScene({ category, variant = 0 }: { category: GiftSceneCategory; variant?: number }) {
  switch (category) {
    case "heart":   return <HeartScene variant={variant} />;
    case "rose":    return <RoseScene variant={variant} />;
    case "bear":    return <BearScene variant={variant} />;
    case "ring":    return <RingScene variant={variant} />;
    case "special": { const S = SPECIAL_SCENES[variant % SPECIAL_SCENES.length]; return <S />; }
  }
}
