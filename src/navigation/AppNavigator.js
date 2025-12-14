import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../utils/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import StatsScreen from '../screens/StatsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import NewWorkoutScreen from '../screens/NewWorkoutScreen';
import EditWorkoutScreen from '../screens/EditWorkoutScreen';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const getTabBarIcon = ({ focused, color, size, route }) => {
    let iconName;

    if (route.name === 'Allenamenti') {
      iconName = focused ? 'barbell' : 'barbell-outline';
    } else if (route.name === 'Esercizi') {
      iconName = focused ? 'list' : 'list-outline';
    } else if (route.name === 'Statistiche') {
      iconName = focused ? 'stats-chart' : 'stats-chart-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => 
          getTabBarIcon({ focused, color, size, route }),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Allenamenti" component={WorkoutsScreen} />
      <Tab.Screen name="Esercizi" component={ExercisesScreen} />
      <Tab.Screen name="Statistiche" component={StatsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // TODO: Add loading screen
  }

  const screenOptions = {
    headerStyle: {
      backgroundColor: colors.primary,
    },
    headerTintColor: colors.white,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  const hideHeaderOptions = { headerShown: false };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={hideHeaderOptions}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={TabNavigator}
              options={hideHeaderOptions}
            />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={{ title: 'Dettagli Allenamento' }}
            />
            <Stack.Screen
              name="NewWorkout"
              component={NewWorkoutScreen}
              options={{ title: 'Nuovo Allenamento' }}
            />
            <Stack.Screen
              name="EditWorkout"
              component={EditWorkoutScreen}
              options={{ title: 'Modifica Allenamento' }}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              options={{ title: 'Calendario' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
