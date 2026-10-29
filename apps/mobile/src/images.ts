import { ImageSourcePropType } from "react-native";
import { Request } from "./types";
const images: Record<string, ImageSourcePropType> = {
  Utilities: require("../assets/amara-family.png"),
  Education: require("../assets/education.jpg"),
  Healthcare: require("../assets/health.jpg"),
  Housing: require("../assets/housing.jpg"),
  "Clean Energy": require("../assets/energy.jpg"),
  Agriculture: require("../assets/agriculture.jpg"),
};
export function requestImage(request: Request): ImageSourcePropType {
  return (
    images[request.category] ||
    (request.image ? { uri: request.image } : images.Utilities)
  );
}
