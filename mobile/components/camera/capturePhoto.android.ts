import * as ImageManipulator from "expo-image-manipulator";
import { Camera } from "react-native-vision-camera";

export async function capturePhoto(cameraRef: React.RefObject<Camera>): Promise<string | null> {
  if (!cameraRef.current) return null;
  // REPLACE WITH THIS
const photo = await cameraRef.current.takePhoto({
  flash: "off",
});
  const resized = await ImageManipulator.manipulateAsync(
    `file://${photo.path}`,
    [{ resize: { width: 224, height: 224 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return resized.base64 ?? null;
}