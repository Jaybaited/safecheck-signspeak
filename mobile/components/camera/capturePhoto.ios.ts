import { CameraView } from "expo-camera";

export async function capturePhoto(cameraRef: React.RefObject<CameraView>): Promise<string | null> {
  if (!cameraRef.current) return null;
  const photo = await cameraRef.current.takePictureAsync({
    base64: true,
    quality: 0.35,
    shutterSound: false,
  });
  return photo?.base64 ?? null;
}