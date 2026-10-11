import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../store/themeStore";
import { getColors, ThemeColors } from "../../lib/theme";
import { isYouTubeUrl, parseYouTubeLink, YouTubeInfo } from "../../lib/video";
import { resolveMediaUrl } from "../../lib/media";

interface VideoBoxProps {
  mode: "lesson" | "exam";
  url?: string | null;
}

// ── Placeholder (missing link, YouTube link inside an exam, bad link) ─────────
function Placeholder({ message, colors }: { message: string; colors: ThemeColors }) {
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="videocam-off-outline" size={28} color={colors.muted} />
      <Text style={[styles.placeholderText, { color: colors.subtext }]}>{message}</Text>
    </View>
  );
}

// ── Lesson: YouTube, no native controls, one Play/Pause/Replay button ─────────
function LessonVideo({ info, colors }: { info: YouTubeInfo; colors: ThemeColors }) {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const [width, setWidth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const height = Math.round((width * 9) / 16);

  // initialPlayerParams is only read once, so keep it stable
  const params = useMemo(
    () => ({
      controls: false,
      modestbranding: true,
      rel: false,
      preventFullScreen: true,
      iv_load_policy: 3,
      ...(info.start !== undefined ? { start: info.start } : {}),
      ...(info.end !== undefined ? { end: info.end } : {}),
    }),
    [info.start, info.end],
  );

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const onChangeState = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      setEnded(true);
    } else if (state === "playing") {
      setEnded(false);
      setPlaying(true);
    } else if (state === "paused") {
      setPlaying(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (ended) {
      playerRef.current?.seekTo(info.start ?? 0, true);
      setEnded(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [ended, info.start]);

  const label = ended ? "Replay" : playing ? "Pause" : "Play";
  const icon = ended ? "refresh" : playing ? "pause" : "play";

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <View style={{ width, height, borderRadius: 12, overflow: "hidden", backgroundColor: "#000" }}>
          {/* pointerEvents none: the WebView never receives touches, so no YouTube menu opens */}
          <View pointerEvents="none" style={{ width, height }}>
            <YoutubePlayer
              ref={playerRef}
              height={height}
              width={width}
              videoId={info.id}
              play={playing}
              onChangeState={onChangeState}
              onError={(e: string) => setError(e)}
              initialPlayerParams={params}
              webViewProps={{ allowsFullscreenVideo: false }}
            />
          </View>
          {/* Transparent layer: tapping the video toggles play/pause */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={`${label} video`}
          />
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.primary }]}>
          The lesson video could not be played ({error}).
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <Ionicons name={icon} size={18} color="#fff" />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Exam: uploaded file, native controls, no fullscreen, no PiP ───────────────
function ExamFileVideo({ uri, colors }: { uri: string; colors: ThemeColors }) {
  const [error, setError] = useState<string | null>(null);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status, error: err }) => {
      if (status === "error") setError(err?.message ?? "Could not load the video.");
      else if (status === "readyToPlay") setError(null);
    });
    return () => sub.remove();
  }, [player]);

  const retry = () => {
    setError(null);
    player.replace(uri);
  };

  return (
    <View>
      <VideoView
        player={player}
        nativeControls
       fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        contentFit="contain"
        style={styles.fileVideo}
      />
      {error && (
        <View>
          <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={retry}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export default function VideoBox({ mode, url }: VideoBoxProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const colors = getColors(resolvedTheme);

  if (mode === "lesson") {
    if (!url) return <Placeholder message="The lesson video is not available yet." colors={colors} />;
    const info = parseYouTubeLink(url);
    if (!info) return <Placeholder message="This lesson link is not a valid YouTube video." colors={colors} />;
    return <LessonVideo key={`${info.id}-${info.start ?? 0}-${info.end ?? 0}`} info={info} colors={colors} />;
  }

  // exam mode: uploaded files only
  if (!url) return <Placeholder message="No video for this question." colors={colors} />;
  if (isYouTubeUrl(url)) {
    return <Placeholder message="This video cannot be played here. Please tell your teacher." colors={colors} />;
  }
  const uri = resolveMediaUrl(url);
  if (!uri) return <Placeholder message="No video for this question." colors={colors} />;
  return <ExamFileVideo key={uri} uri={uri} colors={colors} />;
}

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  placeholderText: { fontSize: 13, textAlign: "center" },
  fileVideo: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  button: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { marginTop: 8, fontSize: 13 },
});