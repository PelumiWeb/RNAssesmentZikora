import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { TabParamList } from './types';
import { colors, type } from '../theme/tokens';
import { HomeScreen } from '../screens/HomeScreen';
import { PayScreen } from '../screens/PayScreen';
import { StubScreen } from '../screens/StubScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Pay: 'paper-plane-outline',
  Budget: 'layers-outline',
  Cards: 'card-outline',
  Account: 'person-outline',
};

export const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: type.caption,
      tabBarStyle: styles.bar,
      tabBarIcon: ({ color, focused }) => (
        <View style={styles.iconWrap}>
          {focused && <View style={styles.indicator} />}
          <Ionicons name={ICONS[route.name]} size={22} color={color} />
        </View>
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Pay" component={PayScreen} />
    <Tab.Screen name="Budget">{() => <StubScreen title="Budget" />}</Tab.Screen>
    <Tab.Screen name="Cards">{() => <StubScreen title="Cards" />}</Tab.Screen>
    <Tab.Screen name="Account">{() => <StubScreen title="Account" />}</Tab.Screen>
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  bar: { height: 64, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.border },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
