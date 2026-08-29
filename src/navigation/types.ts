import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  AllTransactions: undefined;
  SendMoney: { beneficiaryId?: string } | undefined;
  Receipt: undefined;
};

export type TabParamList = {
  Home: undefined;
  Pay: undefined;
  Budget: undefined;
  Cards: undefined;
  Account: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required shape for React Navigation's global type augmentation
    interface RootParamList extends RootStackParamList {}
  }
}
