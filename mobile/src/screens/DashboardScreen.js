import React, { useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'
import { TaskCard } from '../components/TaskCard.js'
import { TaskDetailModal } from '../components/TaskDetailModal.js'
import { TaskFormModal } from '../components/TaskFormModal.js'
import { focusTask } from '../lib/priority.js'
import { greeting, longToday, daysUntil } from '../lib/date.js'
import { productivityScore, motivationalMessage } from '../lib/analytics.js'

export function DashboardScreen({ navigation }) {
  const { tasks, stats, user, addTask, toggleComplete, deleteTask, toggleFavorite } = useApp()
  const [quickTitle, setQuickTitle] = useState('')
  const [detailTask, setDetailTask] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const focus = useMemo(() => focusTask(tasks), [tasks])
  const score = useMemo(() => productivityScore(tasks, stats), [tasks, stats])
  const message = useMemo(() => motivationalMessage(stats, score), [stats, score])

  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.completed && daysUntil(t) === 0).slice(0, 5),
    [tasks],
  )

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return
    addTask({
      title: quickTitle.trim(),
      category: 'Academic',
    })
    setQuickTitle('')
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero banner */}
        <View style={styles.hero}>
          <Text style={styles.heroDate}>{longToday()}</Text>
          <Text style={styles.heroGreeting}>
            {greeting()}, {user?.name || 'Student'} 👋
          </Text>
          <Text style={styles.heroSubtitle}>
            {stats.urgentCount > 0
              ? `You have ${stats.urgentCount} important task${stats.urgentCount === 1 ? '' : 's'} that need attention today.`
              : 'No overdue deadlines. Great moment to get ahead!'}
          </Text>
          <Text style={styles.heroMotivational}>{message}</Text>

          {/* Productivity score bar */}
          <View style={styles.scoreBox}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Productivity Score</Text>
              <Text style={styles.scoreVal}>{score}/100</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${score}%` }]} />
            </View>
          </View>
        </View>

        {/* Quick Add Bar */}
        <View style={styles.quickAddCard}>
          <TextInput
            style={styles.quickInput}
            placeholder="Quick add a task... press +"
            value={quickTitle}
            onChangeText={setQuickTitle}
            onSubmitEditing={handleQuickAdd}
          />
          <TouchableOpacity
            style={[styles.quickBtn, !quickTitle.trim() && styles.quickBtnDisabled]}
            onPress={handleQuickAdd}
            disabled={!quickTitle.trim()}
          >
            <Plus size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#5b5bd6' }]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statHint}>{stats.pending} to do</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statHint}>{stats.percent}% done</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statHint}>{stats.dueToday.length} today</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
            <Text style={styles.statLabel}>Urgent</Text>
            <Text style={styles.statNumber}>{stats.byPriority.high}</Text>
            <Text style={styles.statHint}>{stats.overdue.length} overdue</Text>
          </View>
        </View>

        {/* Smart Focus Recommendation */}
        {focus && (
          <View style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <View style={styles.sparkleRow}>
                <Sparkles size={16} color="#4338ca" />
                <Text style={styles.focusEyebrow}>Smart Focus Recommendation</Text>
              </View>
              <Text style={styles.focusReason}>Highest priority</Text>
            </View>

            <Text style={styles.focusTitle}>{focus.title}</Text>
            {focus.description ? (
              <Text style={styles.focusDesc} numberOfLines={2}>
                {focus.description}
              </Text>
            ) : null}

            <View style={styles.focusActions}>
              <TouchableOpacity
                style={styles.focusActionBtn}
                onPress={() => navigation.navigate('Focus')}
              >
                <Clock size={16} color="#ffffff" />
                <Text style={styles.focusActionText}>Start Focus Session</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.focusCheckBtn}
                onPress={() => toggleComplete(focus.id)}
              >
                <CheckCircle2 size={16} color="#5b5bd6" />
                <Text style={styles.focusCheckText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Priority Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {todayTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <CheckCircle2 size={32} color="#10b981" />
              <Text style={styles.emptyTitle}>Clear for today!</Text>
              <Text style={styles.emptySubtitle}>You have no pending deadlines due today.</Text>
            </View>
          ) : (
            todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleComplete}
                onSelect={(t) => setDetailTask(t)}
                onFavorite={toggleFavorite}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <TaskDetailModal
        visible={Boolean(detailTask)}
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onToggle={toggleComplete}
        onDelete={deleteTask}
        onFavorite={toggleFavorite}
      />

      <TaskFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={addTask}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#101a3a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 18,
  },
  heroMotivational: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 6,
  },
  scoreBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  scoreVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
  },
  meterTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#34d399',
    borderRadius: 999,
  },
  quickAddCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 6,
    paddingLeft: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 6,
  },
  quickBtn: {
    backgroundColor: '#5b5bd6',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  focusCard: {
    backgroundColor: '#eef0ff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca',
    textTransform: 'uppercase',
  },
  focusReason: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  focusTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  focusDesc: {
    fontSize: 13,
    color: '#4338ca',
    marginTop: 4,
    lineHeight: 18,
  },
  focusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  focusActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#5b5bd6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  focusActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  focusCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  focusCheckText: {
    color: '#5b5bd6',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b5bd6',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
})
