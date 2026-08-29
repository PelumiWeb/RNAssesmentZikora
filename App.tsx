import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSessionLifecycle } from './src/hooks/useSessionLifecycle';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // A failed refetch must leave the previous data in place, never blank the list.
      refetchOnWindowFocus: false,
    },
  },
});

const Root = () => {
  useSessionLifecycle();
  return <RootNavigator />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
