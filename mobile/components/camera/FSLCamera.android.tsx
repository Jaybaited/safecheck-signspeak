import React, { forwardRef } from "react";
import { Camera, useCameraDevice } from "react-native-vision-camera";

export const FSLCamera = forwardRef<Camera>((props, ref) => {
  const device = useCameraDevice("front");
  if (!device) return null;
  return (
    <Camera
      ref={ref}
      style={{ flex: 1 }}
      device={device}
      isActive={true}
      photo={true}
    />
  );
});

export { Camera as CameraRef };
export { useCameraDevice };
export { useCameraPermission } from "react-native-vision-camera";