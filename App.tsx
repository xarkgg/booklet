import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a181b' }}>
      <StatusBar style="light" />
    </View>
  );
}
