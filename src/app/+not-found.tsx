import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Écran introuvable</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Retour à l’anémomètre</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: theme.text, fontSize: 18, fontWeight: '700' },
  link: { padding: 8 },
  linkText: { color: theme.accent, fontSize: 15, fontWeight: '600' },
});
