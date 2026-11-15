import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/home/GlassPanel';
import { TimeText } from './TimeText';
import { formatDays, type Medication } from '@/services/medications';
import { mediColors } from '@/theme/tokens';

/** การ์ดยา 1 รายการในหน้ารายการ: เวลา + Medication : ชื่อ + รายละเอียด + รูปยา */
export function MedicationCard({ med, onPress }: { med: Medication; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${med.name} ${med.timeOfDay}`}>
      <GlassPanel radius={22} tint={mediColors.card} border={mediColors.cardBorder} style={styles.card}>
        <View style={styles.left}>
          <TimeText time={med.timeOfDay} size={50} style={{ textAlign: 'left' }} />
          <Text style={styles.name} numberOfLines={1}>
            Medication : {med.name}
          </Text>
          <Text style={styles.details} numberOfLines={2}>
            {med.details?.trim() || formatDays(med.days)}
          </Text>
        </View>
        <View style={styles.img}>
          {med.image ? (
            <Image source={{ uri: med.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="medkit-outline" size={34} color="rgba(255,255,255,0.35)" />
          )}
        </View>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, minHeight: 150, gap: 12 },
  left: { flex: 1, justifyContent: 'center' },
  name: { marginTop: 8, color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  details: { marginTop: 2, color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  img: {
    width: 124,
    height: 114,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mediColors.imageBox,
    borderWidth: 1,
    borderColor: mediColors.imageBorder,
  },
});
