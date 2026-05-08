import React from "react";
import { ViewStyle } from "react-native";

interface FSLCameraProps {
  style?: ViewStyle;
  onReady?: () => void;
}

export declare const FSLCamera: React.ForwardRefExoticComponent<
  FSLCameraProps & React.RefAttributes<any>
>;