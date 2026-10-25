import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Play, Pause, RotateCcw, Check, Sparkles, Clock, SkipForward } from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'

const PRESETS = [25, 50, 90]

export function FocusScreen() {
  const { tasks, focusSessions, addFocusSession, toggleComplete } = useApp()
  const pending = useMemo(() => tasks.filter((t) => !t.completed), [tasks])

  const [duration, setDuration] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [active, setActive] = useState(false)
  const [selectedTask, setSelectedTask] = useState(pending[0] || null)

  const timerRef = useRef(null)

  useEffect(() => {
    if (!selectedTask && pending.length > 0) {
      setSelectedTask(pending[0])
    }
  }, [pending, selectedTask])

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            handleCompleteSession()
            return 0
          }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [active])

  const handleCompleteSession = () => {
    setActive(false)
    const actual = Math.max(1, duration - Math.ceil(remaining / 60))
    addFocusSession({
      taskId: selectedTask?.id || null,
      taskTitle: selectedTask?.title || 'Focus Session',
      plannedMinutes: duration,
      actualMinutes: actual,
    })
    setRemaining(duration * 60)
  }

  const handleSelectPreset = (m) => {
    setActive(false)
    setDuration(m)
    setRemaining(m * 60)
  }

  const handleReset = () => {
    setActive(false)
    setRemaining(duration * 60)
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  const todaySessions = focusSessions.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
  )
  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Deep Work Hero */}
      <View style={styles.timerHero}>
        <View style={styles.badge}>
          <Sparkles size={14} color="#e0e7ff" />
          <Text style={styles.badgeText}>{active ? 'Focus in Progress' : 'Deep Work Mode'}</Text>
        </View>

        {/* Timer Display */}
        <View style={styles.timerCircle}>
          <Text style={styles.timerDigits}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.timerSub}>{active ? 'remaining' : 'minutes'}</Text>
        </View>

        {/* Presets */}
        <View style={styles.presetRow}>
          {PRESETS.map((m) => (
            <TouchableOpacity
              key={m}
              disabled={active}
              onPress={() => handleSelectPreset(m)}
              style={[styles.presetBtn, duration === m && styles.presetBtnActive]}
            >
              <Text style={[styles.presetText, duration === m && styles.presetTextActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.mainControlBtn}
            onPress={() => setActive((v) => !v)}
          >
            {active ? (
              <Pause size={20} color="#1e1b4b" />
            ) : (
              <Play size={20} color="#1e1b4b" />
            )}
            <Text style={styles.mainControlText}>{active ? 'Pause' : 'Start Focus'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleReset}>
            <RotateCcw size={18} color="#ffffff" />
          </TouchableOpacity>

          {active && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleCompleteSession}>
              <SkipForward size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Task in Focus */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Currently Focusing On</Text>
        {selectedTask ? (
          <View style={styles.selectedTaskBox}>
            <Text style={styles.selectedTaskTitle}>{selectedTask.title}</Text>
            <Text style={styles.selectedTaskCategory}>{selectedTask.category}</Text>

            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => toggleComplete(selectedTask.id)}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.completeBtnText}>Mark as Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noTaskText}>No pending tasks selected.</Text>
        )}
      </View>

      {/* Today's Focus Stats */}
      <View style={styles.card}>
        <View style={styles.statHeader}>
          <Text style={styles.cardTitle}>Today's Focus Log</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todaySessions.length} sessions</Text>
          </View>
        </View>

        <Text style={styles.statMinutes}>
          {todayMinutes} <Text style={styles.statMinutesUnit}>minutes focused</Text>
        </Text>

        <View style={styles.historyList}>
          {todaySessions.slice(0, 3).map((session) => (
            <View key={session.id} style={styles.historyItem}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {session.taskTitle}
              </Text>
              <Text style={styles.historyDuration}>{session.actualMinutes}m</Text>
            </View>
          ))}
        </View>
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
  timerHero: {
    backgroundColor: '#101a3a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e0e7ff',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  timerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#ffffff',
  },
  presetText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  presetTextActive: {
    color: '#ffffff',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  mainControlText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101a3a',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  selectedTaskBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedTaskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  selectedTaskCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  noTaskText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#eef0ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b5bd6',
  },
  statMinutes: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  statMinutesUnit: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  historyList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b5bd6',
  },
})
