import React, { useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { BrainCircuit, Sparkles, RefreshCw, AlertCircle } from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'
import { analyze, sortByPriority } from '../lib/priority.js'
import { shortDue } from '../lib/date.js'
import { TaskDetailModal } from '../components/TaskDetailModal.js'

export function PriorityScreen() {
  const { tasks, toggleComplete, deleteTask, toggleFavorite } = useApp()
  const [detailTask, setDetailTask] = useState(null)

  const rankedTasks = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed)
    return sortByPriority(pending).map((task, index) => ({
      task,
      rank: index + 1,
      ...analyze(task, { tasks }),
    }))
  }, [tasks])

  return (
    <View style={styles.container}>
      {/* Signature Feature Banner */}
      <View style={styles.headerBox}>
        <View style={styles.badgeRow}>
          <Sparkles size={14} color="#5b5bd6" />
          <Text style={styles.eyebrow}>AI-Free Deterministic Engine</Text>
        </View>
        <Text style={styles.headerTitle}>Smart Priority</Text>
        <Text style={styles.headerDesc}>
          Every task is scored from 0 to 100 based on deadline urgency, category weight, estimated effort, and waiting time.
        </Text>
      </View>

      {/* Scoring Guide Pills */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>Urgency Scoring Rules:</Text>
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.pillText, { color: '#dc2626' }]}>Overdue: +55</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.pillText, { color: '#d97706' }]}>Today: +50</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#eef0ff' }]}>
            <Text style={[styles.pillText, { color: '#4338ca' }]}>Tomorrow: +40</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.pillText, { color: '#475569' }]}>Exam Prep: +25</Text>
          </View>
        </View>
      </View>

      {/* Ranked Tasks List */}
      <FlatList
        data={rankedTasks}
        keyExtractor={(item) => item.task.id}
        renderItem={({ item }) => {
          const priorityColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#3b82f6',
          }
          const barColor = priorityColors[item.priority] || '#3b82f6'

          return (
            <TouchableOpacity
              style={styles.rankCard}
              activeOpacity={0.8}
              onPress={() => setDetailTask(item.task)}
            >
              <View style={styles.cardTop}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>#{item.rank}</Text>
                </View>

                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {item.task.title}
                  </Text>
                  <Text style={styles.taskSub}>
                    {item.task.category} • {shortDue(item.task)}
                  </Text>
                </View>

                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{item.score}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${item.score}%`, backgroundColor: barColor }]} />
              </View>

              {/* Top Reason */}
              <Text style={styles.reasonText} numberOfLines={1}>
                💡 {item.factors.find((f) => f.points > 0)?.label || 'Normal priority'}
              </Text>
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No pending tasks to rank.</Text>
          </View>
        }
      />

      <TaskDetailModal
        visible={Boolean(detailTask)}
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onToggle={toggleComplete}
        onDelete={deleteTask}
        onFavorite={toggleFavorite}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b5bd6',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  guideContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  guideTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  rankCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  scoreMax: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  reasonText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
})
