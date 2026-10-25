import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  LayoutDashboard,
  ListTodo,
  Sparkles,
  Focus,
  CalendarDays,
  Settings,
} from 'lucide-react-native'
import { AppProvider, useApp } from './src/context/AppContext.js'
import { DashboardScreen } from './src/screens/DashboardScreen.js'
import { TasksScreen } from './src/screens/TasksScreen.js'
import { PriorityScreen } from './src/screens/PriorityScreen.js'
import { FocusScreen } from './src/screens/FocusScreen.js'
import { CalendarScreen } from './src/screens/CalendarScreen.js'
import { SettingsScreen } from './src/screens/SettingsScreen.js'

const Tab = createBottomTabNavigator()

function MainTabs() {
  const { stats, settings } = useApp()
  const accent = settings.accentColor || '#5b5bd6'

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
          color: '#0f172a',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: 'My Tasks',
          tabBarLabel: 'Tasks',
          tabBarBadge: stats.pending > 0 ? stats.pending : undefined,
          tabBarBadgeStyle: {
            backgroundColor: accent,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <ListTodo size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Priority"
        component={PriorityScreen}
        options={{
          title: 'Smart Priority',
          tabBarLabel: 'Priority',
          tabBarBadge: stats.urgentCount > 0 ? stats.urgentCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusScreen}
        options={{
          title: 'Focus Mode',
          tabBarLabel: 'Focus',
          tabBarIcon: ({ color, size }) => (
            <Focus size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Deadlines',
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size - 2} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <MainTabs />
      </NavigationContainer>
    </AppProvider>
  )
}
