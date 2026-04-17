import React, { forwardRef, useState } from "react";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";

export const FSLCamera = forwardRef((props: any, ref: any) => {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Request permission if not granted
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  if (!hasPermission) return null;
  if (!device) return null;

  return (
    <Camera
      ref={ref}
      style={{ flex: 1 }}
      device={device}
      isActive={true}
      photo={true}
      onInitialized={() => setIsCameraReady(true)}
      onError={(error) => console.error("Camera error:", error)}
      {...props}
    />
  );
});

export { Camera as CameraRef };
export { useCameraDevice };
export { useCameraPermission } from "react-native-vision-camera";