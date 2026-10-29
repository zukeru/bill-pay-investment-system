import React from "react";
import { Platform, View } from "react-native";
/** Native layout with semantic HTML5 landmarks in the exported website. */
export function Landmark({
  as,
  style,
  children,
  label,
}: {
  as: "main" | "aside" | "nav" | "header" | "footer";
  style?: any;
  children: React.ReactNode;
  label?: string;
}) {
  return Platform.OS === "web" ? (
    React.createElement(
      as,
      {
        "aria-label": label,
        style: { display: "flex", boxSizing: "border-box", ...style },
      },
      children,
    )
  ) : (
    <View style={nativeStyle(style)}>{children}</View>
  );
}

function nativeStyle(style: any) {
  const result = { ...style };
  for (const edge of ["Top", "Right", "Bottom", "Left"]) {
    const key = "border" + edge;
    if (result[key]) {
      const match = /([0-9]+)px solid (.+)/.exec(result[key]);
      if (match) {
        result[key + "Width"] = Number(match[1]);
        result[key + "Color"] = match[2];
      }
      delete result[key];
    }
  }
  return result;
}
