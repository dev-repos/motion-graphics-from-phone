import { Composition } from "remotion";
import { KidsLogoReveal } from "./KidsLogoReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KidsLogoReveal"
        component={KidsLogoReveal}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
