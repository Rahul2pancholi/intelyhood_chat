import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { createContact, fetchContact, updateContact } from '../api/contacts';
import { useTheme } from '../theme/useTheme';
import type { ThemeColors } from '../theme/colors';
import type { ContactsStackParamList } from '../navigation/ContactsStackNavigator';

export default function ContactFormScreen() {
  const route = useRoute<RouteProp<ContactsStackParamList, 'ContactForm'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const accountId = useAuthStore(state => state.activeAccountId);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const contactId = route.params?.contactId;
  const isEditing = !!contactId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accountId || !contactId) return;
    fetchContact(accountId, contactId)
      .then(contact => {
        setName(contact.name);
        setEmail(contact.email ?? '');
        setPhoneNumber(contact.phone_number ?? '');
      })
      .finally(() => setLoading(false));
  }, [accountId, contactId]);

  const handleSave = async () => {
    if (!accountId || !name.trim()) return;
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
      };
      const contact = isEditing
        ? await updateContact(accountId, contactId, input)
        : await createContact(accountId, input);
      navigation.replace('ContactDetail', { contactId: contact.id });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Contact name"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="email@example.com"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="+1 555 0100"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
      />

      <Pressable
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving || !name.trim()}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create contact'}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    label: { fontSize: 13, color: colors.textMuted, marginBottom: 4, marginTop: 12 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.textPrimary,
    },
    saveButton: {
      marginTop: 32,
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 16 },
  });
