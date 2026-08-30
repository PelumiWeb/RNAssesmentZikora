import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActionListRow } from '../components/ActionListRow';
import { RootStackParamList } from '../navigation/types';
import { BENEFICIARIES } from '../services/mock/fixtures';
import { avatarColors, colors, radii, spacing, type } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const PayScreen = () => {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pay</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Beneficiaries</Text>
          <Text style={styles.seeAll}>See all</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.beneficiaries}
        >
          {BENEFICIARIES.map((beneficiary, index) => (
            <Pressable
              key={beneficiary.id}
              accessibilityRole="button"
              accessibilityLabel={`Send money to ${beneficiary.name}`}
              accessibilityHint="Prefills the transfer form with this beneficiary"
              style={styles.beneficiary}
              onPress={() =>
                navigation.navigate('SendMoney', { beneficiaryId: beneficiary.id })
              }
            >
              <View
                style={[
                  styles.monogram,
                  { backgroundColor: avatarColors[index % avatarColors.length] },
                ]}
              >
                <Text style={styles.monogramText}>{beneficiary.initials}</Text>
              </View>
              <Text style={styles.beneficiaryName} numberOfLines={2}>
                {beneficiary.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Send Money</Text>
        <View style={styles.group}>
          <ActionListRow
            title="Send Money to Bank Account"
            subtitle="Send money to any local banks in your region swiftly."
            onPress={() => navigation.navigate('SendMoney')}
          />
          <ActionListRow
            title="Send Money via Phone Number/Email"
            subtitle="Send money to any Zikora User by Email/Phone numbers."
            disabled
          />
        </View>

        <Text style={styles.sectionTitle}>Pay Bills</Text>
        <View style={styles.group}>
          <ActionListRow
            title="Buy Airtime"
            subtitle="Buy Airtime to your Phone number"
            disabled
          />
          <ActionListRow
            title="Pay a Bill"
            subtitle="Pay your utility bill, buy data swiftly."
            disabled
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingVertical: spacing.md, alignItems: 'center' },
  headerTitle: { ...type.h2, color: colors.text },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...type.h3,
    color: colors.headingGreen,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  seeAll: { ...type.label, color: colors.textMuted },
  beneficiaries: { gap: spacing.lg, paddingVertical: spacing.sm },
  beneficiary: { width: 72, alignItems: 'center', gap: spacing.sm },
  monogram: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { ...type.bodyStrong, color: colors.surface },
  beneficiaryName: { ...type.caption, color: colors.text, textAlign: 'center' },
  group: { marginBottom: spacing.sm },
});
