import React, { forwardRef, useRef, useImperativeHandle, useEffect } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";

interface FSLCameraProps {
  style?: any;
  onReady?: () => void;
}

export const FSLCamera = forwardRef<any, FSLCameraProps>((props, ref) => {
  const { onReady, style } = props; // ✅ explicitly destructure onReady
  const localRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useImperativeHandle(ref, () => ({
    takePictureAsync: (opts?: any) => localRef.current?.takePictureAsync(opts),
  }));

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission?.granted) {
    return null;
  }

  return (
    <CameraView
      ref={localRef}
      style={[{ flex: 1, width: "100%", height: "100%" }, style]}
      facing="front"
      onCameraReady={() => {
        console.log("📷 onCameraReady fired");
        setTimeout(() => {
          console.log("📷 calling onReady, value:", onReady); // ✅ check this
          onReady?.(); // ✅ uses destructured onReady, not props.onReady
        }, 300);
      }}
    />
  );
});

export { CameraView as CameraRef };
export { useCameraPermissions } from "expo-camera";