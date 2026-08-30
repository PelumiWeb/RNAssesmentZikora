import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, BannerTone } from '../components/Banner';
import { Button } from '../components/Button';
import { DevOfflineToggle } from '../components/DevOfflineToggle';
import { TextField } from '../components/TextField';
import { classifyLogin } from '../domain/auth';
import { login } from '../services/mock/authApi';
import { useSessionStore } from '../state/sessionStore';
import { colors, radii, spacing, type } from '../theme/tokens';

type AccountType = 'personal' | 'business';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LoginScreen = () => {
  const signIn = useSessionStore((s) => s.signIn);

  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: BannerTone; message: string } | null>(null);

  /** State updates are async; two taps in one tick would both read a stale `submitting`. */
  const inFlight = useRef(false);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const canSubmit =
    accountType === 'personal' && emailValid && password.length > 0 && !submitting;

  const onSubmit = async () => {
    if (inFlight.current || !canSubmit) return;
    inFlight.current = true;
    setSubmitting(true);
    setNotice(null);

    try {
      const outcome = classifyLogin(await login({ email, password }));
      if (outcome.kind === 'success') {
        await signIn(outcome.session);
        return; // the root guard swaps navigators; this screen never routes itself
      }
      setNotice({
        tone: outcome.kind === 'unknown' ? 'warning' : 'error',
        message: outcome.message,
      });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.backdrop} />
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.segment}>
              {(['personal', 'business'] as const).map((option) => {
                const active = accountType === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={option === 'personal' ? 'Personal Account' : 'Business Account'}
                    onPress={() => setAccountType(option)}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {option === 'personal' ? 'Personal Account' : 'Business Account'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.title}>Login to your account</Text>

            {accountType === 'business' && (
              <Banner tone="warning" message="Business accounts are not available in this build." />
            )}
            {notice && <Banner tone={notice.tone} message={notice.message} />}

            <TextField
              testID="login-email"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
            />
            <TextField
              testID="login-password"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secure
            />

            <Pressable accessibilityRole="link" style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>

            <Button
              label="Login"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={submitting}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dash} />
              <Text style={styles.dividerText}>Don&apos;t have an account?</Text>
              <View style={styles.dash} />
            </View>

            <Button label="Create an account" variant="outline" onPress={() => {}} />

            <View style={styles.support}>
              <Ionicons name="call-outline" size={18} color={colors.supportOrange} />
              <Text style={styles.supportText}>Contact Support</Text>
            </View>

            <DevOfflineToggle />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.darkCard },
  backdrop: { height: 120, backgroundColor: '#5F6B60' },
  sheetWrap: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xl,
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.trackInactive,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.xxl,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { ...type.label, color: colors.textMuted },
  segmentTextActive: { color: colors.surface, fontWeight: '600' },
  title: { ...type.h2, color: colors.text, marginBottom: spacing.xl },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.xl },
  forgot: {
    ...type.label,
    color: colors.headingGreen,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xl,
  },
  dash: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.borderStrong,
  },
  dividerText: { ...type.caption, color: colors.textMuted },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  supportText: { ...type.label, color: colors.textMuted },
});
