import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Banner } from '../components/Banner';
import { TransactionRow } from '../components/TransactionRow';
import { Transaction } from '../domain/transactions';
import { useAllTransactions } from '../hooks/useTransactions';
import { colors, spacing, type } from '../theme/tokens';

export const AllTransactionsScreen = () => {
  const navigation = useNavigation();
  const query = useAllTransactions();

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => <TransactionRow tx={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.spacer} />
      </View>

      {query.isError && (
        <View style={styles.bannerWrap}>
          <Banner
            tone="warning"
            message={
              query.error instanceof Error
                ? query.error.message
                : "We couldn't refresh right now."
            }
          />
        </View>
      )}

      <FlashList
        data={query.transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : null
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: { ...type.h3, color: colors.text, flex: 1, textAlign: 'center' },
  spacer: { width: 24 },
  bannerWrap: { paddingHorizontal: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  loader: { marginVertical: spacing.xl },
});
