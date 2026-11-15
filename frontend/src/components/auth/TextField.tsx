import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authColors } from '@/theme/tokens';

type Props = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'autoCapitalize' | 'keyboardType' | 'returnKeyType' | 'onSubmitEditing' | 'autoComplete' | 'textContentType'
> & {
  /** ช่องรหัสผ่าน: ซ่อนตัวอักษร + ปุ่มรูปตาเปิด/ปิด */
  secure?: boolean;
  error?: string | null;
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
};

/** ช่องกรอกแบบเส้นใต้ตาม Figma (ข้อความตัวหนาสีเทาเป็น placeholder) */
export function TextField({ secure, error, inputRef, ...input }: Props) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.wrap}>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <TextInput
          ref={inputRef}
          {...input}
          secureTextEntry={secure && hidden}
          autoCorrect={false}
          placeholderTextColor={authColors.fieldLabel}
          style={styles.input}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel="แสดง/ซ่อนรหัสผ่าน">
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={authColors.fieldLabel} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: authColors.fieldLine,
    paddingHorizontal: 6,
  },
  rowError: { borderBottomColor: authColors.error },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: authColors.text,
    // ลบเส้นขอบ focus สีน้ำเงินบนเว็บ
    ...({ outlineStyle: 'none' } as object),
  },
  error: { marginTop: 6, marginLeft: 6, fontSize: 12, color: authColors.error },
});
