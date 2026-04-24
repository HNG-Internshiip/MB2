import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';

type IName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name:string; label:string; icon:IName; active:IName; color:string }[] = [
  { name:'index',        label:'Home',         icon:'home-outline',         active:'home',         color:theme.gold    },
  { name:'transactions', label:'Transactions', icon:'swap-vertical-outline',active:'swap-vertical',color:theme.purple  },
  { name:'analytics',   label:'Analytics',    icon:'bar-chart-outline',    active:'bar-chart',    color:theme.blue    },
  { name:'budget',      label:'Budget',       icon:'wallet-outline',       active:'wallet',       color:theme.income  },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:theme.navBg, borderTopColor:theme.border, borderTopWidth:1, height:58+insets.bottom, paddingBottom:insets.bottom, paddingTop:8 },
      tabBarActiveTintColor: theme.gold,
      tabBarInactiveTintColor: theme.muted,
      tabBarLabelStyle: { fontSize:10, fontWeight:'600' },
    }}>
      {TABS.map(t => (
        <Tabs.Screen key={t.name} name={t.name} options={{
          title: t.label,
          tabBarActiveTintColor: t.color,
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? t.active : t.icon} size={22} color={color} />,
        }} />
      ))}
    </Tabs>
  );
}