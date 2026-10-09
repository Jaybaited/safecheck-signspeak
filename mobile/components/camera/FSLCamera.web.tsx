import React from "react";
import { View, Text } from "react-native";

interface FSLCameraProps {
  style?: any;
  onReady?: () => void;
}

export const FSLCamera = React.forwardRef<any, FSLCameraProps>(
  ({ style, onReady }, ref) => {
    React.useEffect(() => {
      onReady?.();
    }, []);

    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: "#111",
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        <Text style={{ color: "white" }}>
          Camera Preview (Web Placeholder)
        </Text>
      </View>
    );
  }
);

export const CameraRef = {};
export const useCameraDevice = () => null;
export const useCameraPermission = () => ({
  hasPermission: true,
  requestPermission: async () => true,
});