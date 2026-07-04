import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Txt } from "./ui";
import { colors, font } from "../theme";

const LOGO = require("../../assets/elitecrew-logo.png");

// Wordmark lockup. `dark` renders for light backgrounds (default),
// `light` (white text) for the dark hero/splash surfaces.
export function Logo({ size = 28, light = false, withWord = true }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={150}
      />
      {withWord ? (
        <Txt
          size={size * 0.62}
          weight={font.weight.heavy}
          color={light ? colors.textOnInk : colors.ink}
          style={{ letterSpacing: 0.3 }}
        >
          Elite<Txt size={size * 0.62} weight={font.weight.heavy} color={colors.gold}>Crew</Txt>
        </Txt>
      ) : null}
    </View>
  );
}
