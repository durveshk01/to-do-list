import React, { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  User,
  Palette,
  RotateCcw,
  Sparkles,
  Info,
  Check,
} from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'

const ACCENT_COLORS = [
  { name: 'Indigo', hex: '#5b5bd6' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Rose', hex: '#e11d48' },
]

export function SettingsScreen() {
  const { user, settings, setSettings, stats, resetData } = useApp()
  const [name, setName] = useState(user?.name || 'Student')
  const [email, setEmail] = useState(user?.email || 'durvesh@student.edu')

  const handleReset = () => {
    Alert.alert(
      'Reset Sample Data',
      'Are you sure you want to reload the initial sample workspace? Any unsaved custom tasks will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetData },
      ],
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={18} color="#5b5bd6" />
          <Text style={styles.cardTitle}>Profile & Identity</Text>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@university.edu"
          keyboardType="email-address"
        />
      </View>

      {/* Appearance & Accent Color */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Palette size={18} color="#5b5bd6" />
          <Text style={styles.cardTitle}>Appearance & Accents</Text>
        </View>

        <Text style={styles.label}>Theme Accent Color</Text>
        <View style={styles.colorRow}>
          {ACCENT_COLORS.map((c) => {
            const isSelected = (settings.accentColor || '#5b5bd6') === c.hex
            return (
              <TouchableOpacity
                key={c.name}
                onPress={() => setSettings({ ...settings, accentColor: c.hex })}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.hex },
                  isSelected && styles.colorDotSelected,
                ]}
              >
                {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Workspace Stats */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Sparkles size={18} color="#5b5bd6" />
          <Text style={styles.cardTitle}>Workspace Overview</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statKey}>Total Tasks Tracked</Text>
          <Text style={styles.statVal}>{stats.total}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Completed Work</Text>
          <Text style={styles.statVal}>{stats.completed}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statKey}>Completion Rate</Text>
          <Text style={styles.statVal}>{stats.percent}%</Text>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <RotateCcw size={18} color="#ef4444" />
          <Text style={[styles.cardTitle, { color: '#ef4444' }]}>Data Reset</Text>
        </View>
        <Text style={styles.dangerDesc}>
          Reload the default sample workspace tasks and focus sessions.
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset to Sample Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Box */}
      <View style={styles.aboutBox}>
        <Text style={styles.aboutTitle}>TaskFlow Mobile v1.0.0</Text>
        <Text style={styles.aboutSub}>
          Plan clearly, focus deeply, make meaningful progress.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statKey: {
    fontSize: 13,
    color: '#64748b',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  dangerDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
  aboutBox: {
    alignItems: 'center',
    marginTop: 10,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  aboutSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
})
