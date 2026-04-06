import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// Géométrie bocal dans un viewBox 200×360
const JAR_X = 36;
const JAR_Y = 88;
const JAR_W = 128;
const JAR_H = 195;
const JAR_RX = 8;
const JAR_BOTTOM = JAR_Y + JAR_H; // 283
const JAR_CX = JAR_X + JAR_W / 2; // 100

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const { width, height } = Dimensions.get('window');
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3200,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(onFinish, 400);
    });
  }, []);

  // Niveau du liquide
  const liquidHeight = progress.interpolate({
    inputRange: [0, 0.82],
    outputRange: [0, JAR_H],
    extrapolate: 'clamp',
  });
  const liquidY = Animated.subtract(JAR_BOTTOM, liquidHeight);

  // Surface (ellipse qui suit le niveau)
  const surfaceY = progress.interpolate({
    inputRange: [0, 0.82],
    outputRange: [JAR_BOTTOM, JAR_Y],
    extrapolate: 'clamp',
  });

  // Bulles — opacités staggerées, positions fixes dans le bocal
  const bub1Op = progress.interpolate({
    inputRange: [0.22, 0.32, 0.44, 0.54],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const bub2Op = progress.interpolate({
    inputRange: [0.30, 0.40, 0.55, 0.65],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const bub3Op = progress.interpolate({
    inputRange: [0.42, 0.52],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const bub4Op = progress.interpolate({
    inputRange: [0.50, 0.60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const bub5Op = progress.interpolate({
    inputRange: [0.55, 0.65],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Overflow (blobs au-dessus du bocal)
  const overflowOp = progress.interpolate({
    inputRange: [0.78, 0.92],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // Scale via translateY trick (react-native-svg ne supporte pas transform scale animé facilement)
  // On anime juste l'opacité et on utilise des cercles à taille fixe

  // Texte "LEVAINIER"
  const textOp = progress.interpolate({
    inputRange: [0.85, 1.0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Légère ondulation de surface (oscillation gauche/droite du cy de l'ellipse de surface)
  const surfaceRy = progress.interpolate({
    inputRange: [0, 0.3, 0.6, 0.82],
    outputRange: [4, 6, 9, 11],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 200 360"
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <ClipPath id="jarClip">
            <Rect x={JAR_X} y={JAR_Y} width={JAR_W} height={JAR_H} rx={JAR_RX} />
          </ClipPath>
        </Defs>

        {/* ── Liquide + bulles clippés dans le bocal ── */}
        <G clipPath="url(#jarClip)">
          {/* Corps du liquide */}
          <AnimatedRect
            x={JAR_X}
            y={liquidY as any}
            width={JAR_W}
            height={liquidHeight as any}
            fill="#7A5820"
          />
          {/* Surface arrondie (effet de dôme/vague) */}
          <AnimatedEllipse
            cx={JAR_CX}
            cy={surfaceY as any}
            rx={JAR_W / 2 - 4}
            ry={surfaceRy as any}
            fill="#9B7232"
          />

          {/* Bulle 1 — bas gauche */}
          <AnimatedCircle cx={62} cy={258} r={9} fill="none" stroke="#D4A574" strokeWidth={1.8} opacity={bub1Op as any} />
          {/* Bulle 2 — bas droite */}
          <AnimatedCircle cx={136} cy={248} r={7} fill="none" stroke="#D4A574" strokeWidth={1.5} opacity={bub2Op as any} />
          {/* Bulle 3 — milieu gauche */}
          <AnimatedCircle cx={70} cy={218} r={11} fill="none" stroke="#D4A574" strokeWidth={1.8} opacity={bub3Op as any} />
          {/* Bulle 4 — milieu droite */}
          <AnimatedCircle cx={128} cy={205} r={8} fill="none" stroke="#D4A574" strokeWidth={1.5} opacity={bub4Op as any} />
          {/* Bulle 5 — haut centre */}
          <AnimatedCircle cx={93} cy={175} r={6} fill="none" stroke="#D4A574" strokeWidth={1.5} opacity={bub5Op as any} />
        </G>

        {/* ── Outline du bocal (par-dessus le liquide) ── */}
        <Rect
          x={JAR_X}
          y={JAR_Y}
          width={JAR_W}
          height={JAR_H}
          rx={JAR_RX}
          fill="transparent"
          stroke="#B07C4F"
          strokeWidth={3}
        />
        {/* Trait d'ouverture */}
        <Line
          x1={JAR_X}
          y1={JAR_Y + 14}
          x2={JAR_X + JAR_W}
          y2={JAR_Y + 14}
          stroke="#B07C4F"
          strokeWidth={1}
          opacity={0.35}
        />

        {/* ── Overflow (débordement au-dessus du bocal) ── */}
        <AnimatedG opacity={overflowOp as any}>
          <Ellipse cx={JAR_CX} cy={JAR_Y - 10} rx={42} ry={16} fill="#8B6422" />
          <Circle cx={72} cy={JAR_Y - 22} r={16} fill="#9B7232" />
          <Circle cx={130} cy={JAR_Y - 25} r={13} fill="#7A5820" />
          <Circle cx={100} cy={JAR_Y - 35} r={12} fill="#8B6422" />
          <Circle cx={84} cy={JAR_Y - 46} r={8} fill="#9B7232" />
          <Circle cx={116} cy={JAR_Y - 44} r={7} fill="#7A5820" />
          <Circle cx={100} cy={JAR_Y - 54} r={6} fill="#8B6422" />
        </AnimatedG>

        {/* ── Nom de l'app ── */}
        <AnimatedG opacity={textOp as any}>
          <SvgText
            x={100}
            y={326}
            textAnchor="middle"
            fill="#B07C4F"
            fontSize={18}
            fontWeight="700"
            letterSpacing={3}
          >
            LEVAINIER
          </SvgText>
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
