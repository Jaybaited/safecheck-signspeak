import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import * as SecureStore from "expo-secure-store";

export default function SplashScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ✅ LINE REMOVED — no more SecureStore.deleteItemAsync("onboarding_done")

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setTimeout(async () => {
        if (!token) {
          const onboardingDone = await SecureStore.getItemAsync("onboarding_done");
          if (onboardingDone === "true") {
            router.replace("/login");       // ✅ Already seen onboarding → login
          } else {
            router.replace("/onboarding"); // First install only
          }
          return;
        }

        switch (user?.role) {
          case "STUDENT":
            router.replace("/(student)");
            break;
          case "PARENT":
            router.replace("/(parent)");
            break;
          case "TEACHER":
            router.replace("/(teacher)");  // ✅ Fixed
            break;
          case "ADMIN":
            router.replace("/(admin)");
            break;
          default:
            router.replace("/login");
        }
      }, 600);
    });
  }, [router, scale, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Image
          source={require("../assets/logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
  },
});