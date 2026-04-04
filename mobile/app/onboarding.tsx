import React, { useRef, useState } from "react";
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, FlatList, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    image: require("../assets/images/onboard1.png"),
    title: "Welcome to SafeCheck SignSpeak",
    desc: "The all-in-one platform for attendance, safety, and sign language — built for PSD's K–12 community.",
  },
  {
    id: "2",
    image: require("../assets/images/onboard2.png"),
    title: "Sign, Scan & Stay Safe",
    desc: "Practice Filipino Sign Language, track attendance with RFID, and stay connected with real-time campus safety.",
  },
  {
    id: "3",
    image: require("../assets/images/onboard3.png"),
    title: "Ready to Get Started?",
    desc: "Join your school community and start learning sign language the fun and modern way.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      await SecureStore.setItemAsync("onboarding_done", "true");
      router.replace("/login");
    }
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync("onboarding_done", "true");
    router.replace("/login");
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Skip */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <View style={s.slide}>
            {/* Illustration area */}
            <View style={s.imageContainer}>
              <Image
                source={item.image}
                style={s.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Bottom card */}
            <View style={s.card}>
              {/* Animated dots */}
              <View style={s.dotsRow}>
                {SLIDES.map((_, i) => {
                  const dotWidth = scrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    outputRange: [8, 28, 8],
                    extrapolate: "clamp",
                  });
                  const opacity = scrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                  });
                  return (
                    <Animated.View
                      key={i}
                      style={[s.dot, { width: dotWidth, opacity }]}
                    />
                  );
                })}
              </View>

              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc}>{item.desc}</Text>

              <TouchableOpacity
                style={s.nextBtn}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={s.nextBtnText}>
                  {currentIndex === SLIDES.length - 1 ? "Get Started 🎉" : "Next →"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#FDF4F4" },

  skipBtn:        {
    position: "absolute",
    top: 52,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(139,26,26,0.08)",
  },
  skipText:       { color: "#8B1A1A", fontWeight: "700", fontSize: 13 },

  slide:          { width, flex: 1 },

  imageContainer: {
    width,
    height: height * 0.52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF4F4",
    paddingTop: 24,
  },
  illustration:   { width: width * 0.88, height: height * 0.46 },

  card:           {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },

  dotsRow:        { flexDirection: "row", gap: 6, marginBottom: 20 },
  dot:            { height: 8, borderRadius: 4, backgroundColor: "#8B1A1A" },

  title:          {
    color: "#1A0505",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 30,
  },
  desc:           {
    color: "#7A4040",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  nextBtn:        {
    width: "100%",
    backgroundColor: "#8B1A1A",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#8B1A1A",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  nextBtnText:    { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
});