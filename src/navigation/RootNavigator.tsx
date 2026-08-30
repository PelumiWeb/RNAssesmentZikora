import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { AllTransactionsScreen } from '../screens/AllTransactionsScreen';
import { SendMoneyScreen } from '../screens/SendMoneyScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { useSessionStore } from '../state/sessionStore';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The only place a session decides what the user sees. Storage reports what it holds;
 * this component decides where that lands.
 */
export const RootNavigator = () => {
  const phase = useSessionStore((s) => s.phase);

  if (phase === 'hydrating') {
    return (
      <View style={styles.splash} accessibilityLabel="Restoring your session">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {phase === 'authenticated' ? (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} />
          <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
