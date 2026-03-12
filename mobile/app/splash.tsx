import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function SplashScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start(() => {
      setTimeout(() => {
        if (!token) {
          router.replace("/onboarding");
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
          case "ADMIN":
            router.replace("/(admin)");
            break;
          default:
            router.replace("/onboarding");
        }
      }, 600);
    });
  }, [router, scale, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Image
          source={require("../assets/icon.png")}
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
    backgroundColor: "#0F0F23",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
  },
});
