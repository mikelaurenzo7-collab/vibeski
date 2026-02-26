import React, { useState, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor={Colors.warmGrayLight}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          editable={!disabled}
          testID="chat-input"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            canSend ? styles.sendActive : styles.sendInactive,
            pressed && canSend && styles.sendPressed,
          ]}
          testID="send-button"
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? Colors.white : Colors.warmGrayLight}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.inputBg,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: Colors.black,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    lineHeight: 22,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendActive: {
    backgroundColor: Colors.primary,
  },
  sendInactive: {
    backgroundColor: 'transparent',
  },
  sendPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
