import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The design fills three of these slots with photography that was not supplied. They render
 * as branded placeholders; dropping an image into assets/ and swapping this for an <Image>
 * completes the frame without touching the layout.
 */
const PhotoSlot = ({ style }: { style?: object }) => (
  <View style={[styles.photo, style]} accessible={false}>
    <Ionicons name="person" size={26} color={colors.primary} />
  </View>
);

export const OnboardingScreen = () => {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Bleed art: clipped rather than scrolled, so short screens lose collage, never content. */}
      <View style={styles.collage}>
        <View style={styles.column}>
          <View style={[styles.pill, styles.outlined, { height: 200 }]}>
            <View style={styles.dot} />
            <Ionicons name="reorder-three-outline" size={30} color={colors.border} />
          </View>
          <PhotoSlot />
          <View style={[styles.pill, styles.solid, { height: 260 }]} />
        </View>

        <View style={styles.column}>
          <View style={[styles.pill, styles.solid, styles.hero]}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroText}>New Age Banking</Text>
            </View>
            <View style={styles.heroDot} />
          </View>
        </View>

        <View style={styles.column}>
          <PhotoSlot />
          <View style={[styles.circle, styles.outlined]}>
            <Text style={styles.logoMark}>Z</Text>
            <Text style={styles.logoWord}>ZIKORA</Text>
          </View>
          <View style={[styles.pill, styles.outlined, { height: 190 }]}>
            <Ionicons name="trending-up-outline" size={30} color={colors.primary} />
          </View>
          <PhotoSlot />
        </View>

        <View style={styles.column}>
          <View style={[styles.circle, styles.outlined]}>
            <View style={styles.dot} />
          </View>
          <View style={[styles.pill, styles.solid, { height: 200 }]} />
          <View style={[styles.pill, styles.outlined, { height: 260 }]}>
            <View style={styles.spacerFlex} />
            <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Welcome to Zikora Bank</Text>
        </View>

        <Text style={styles.headline}>
          Manage your finances effortlessly with our intuitive app.
        </Text>
        <Text style={styles.body}>
          Open an account from the comfort of your home, and experience smooth, hassle-free
          transactions.
        </Text>

        <Button
          label="Get Started"
          onPress={() => navigation.navigate('Login')}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  collage: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  column: { flex: 1, gap: spacing.md },
  pill: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  outlined: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  solid: { backgroundColor: colors.primary },
  circle: {
    aspectRatio: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    aspectRatio: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xl },
  heroTextWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroText: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '600',
    transform: [{ rotate: '-90deg' }],
    width: 300,
    textAlign: 'center',
  },
  heroDot: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  dot: { width: 22, height: 22, borderRadius: radii.pill, backgroundColor: colors.primary },
  spacerFlex: { flex: 1 },
  logoMark: { fontSize: 22, fontWeight: '700', color: colors.primary, lineHeight: 24 },
  logoWord: { fontSize: 6, letterSpacing: 2, color: colors.textMuted },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badgeText: { ...type.label, color: colors.text },
  headline: { ...type.h1, color: colors.text, marginTop: spacing.lg },
  body: { ...type.body, color: colors.textMuted, marginTop: spacing.md },
  cta: { marginTop: spacing.xxl, marginBottom: spacing.lg },
});
