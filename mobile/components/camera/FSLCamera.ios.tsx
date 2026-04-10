import React, { forwardRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";

export const FSLCamera = forwardRef<CameraView>((props, ref) => {
  return (
    <CameraView
      ref={ref}
      style={{ flex: 1 }}
      facing="front"
    />
  );
});

export { CameraView as CameraRef };
export { useCameraPermissions };