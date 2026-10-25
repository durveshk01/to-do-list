import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Check, Clock, Star, AlertCircle } from 'lucide-react-native'
import { analyze } from '../lib/priority.js'
import { shortDue, isOverdue } from '../lib/date.js'

export function TaskCard({ task, onToggle, onSelect, onFavorite }) {
  const { score, priority } = analyze(task)
  const overdue = isOverdue(task)

  const priorityColors = {
    high: { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    low: { bg: '#dbeafe', text: '#2563eb' },
    none: { bg: '#f1f5f9', text: '#64748b' },
  }
  const color = priorityColors[priority] || priorityColors.low

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={() => onSelect(task)}>
      <View style={styles.row}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(task.id)}
          style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
        >
          {task.completed && <Check size={14} color="#ffffff" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Title & Category */}
        <View style={styles.main}>
          <Text
            style={[styles.title, task.completed && styles.titleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>

            {task.dueDate ? (
              <View style={[styles.dueBadge, overdue && styles.dueBadgeOverdue]}>
                <Clock size={11} color={overdue ? '#dc2626' : '#64748b'} />
                <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                  {shortDue(task)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Priority Badge & Favorite */}
        <View style={styles.rightCol}>
          <View style={[styles.priorityBadge, { backgroundColor: color.bg }]}>
            <Text style={[styles.priorityText, { color: color.text }]}>
              {score} pts
            </Text>
          </View>

          {onFavorite && (
            <TouchableOpacity onPress={() => onFavorite(task.id)} style={styles.favBtn}>
              <Star
                size={16}
                color={task.favorite ? '#eab308' : '#cbd5e1'}
                fill={task.favorite ? '#eab308' : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  main: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dueBadgeOverdue: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  dueText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dueTextOverdue: {
    color: '#dc2626',
    fontWeight: '600',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  favBtn: {
    padding: 2,
  },
})
