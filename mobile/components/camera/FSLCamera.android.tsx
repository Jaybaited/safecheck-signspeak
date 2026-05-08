import React, { forwardRef } from "react";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";

interface FSLCameraProps {
  style?: any;
  onReady?: () => void;
}

export const FSLCamera = forwardRef<Camera, FSLCameraProps>((props, ref) => {
  const { onReady, ...rest } = props;
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();

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
      onInitialized={() => onReady?.()}
      onError={(error) => console.error("Camera error:", error)}
      {...rest}
    />
  );
});

export { Camera as CameraRef };
export { useCameraDevice };
export { useCameraPermission } from "react-native-vision-camera";