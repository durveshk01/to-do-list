import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import { X, Check, Trash2, Calendar, Clock, Star, BrainCircuit } from 'lucide-react-native'
import { analyze } from '../lib/priority.js'
import { formatDateTime, relativeDue } from '../lib/date.js'

export function TaskDetailModal({ visible, task, onClose, onToggle, onDelete, onFavorite }) {
  if (!task) return null

  const { score, factors, priority } = analyze(task)

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.title, task.completed && styles.titleCompleted]}>
              {task.title}
            </Text>

            {/* Status & Due Date */}
            <View style={styles.metaBox}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.metaText}>{relativeDue(task)}</Text>
              </View>
              {task.dueDate ? (
                <View style={styles.metaItem}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.metaText}>{formatDateTime(task)}</Text>
                </View>
              ) : null}
            </View>

            {/* Smart Priority Score Breakdown */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrainCircuit size={18} color="#5b5bd6" />
                  <Text style={styles.scoreTitle}>Smart Priority Breakdown</Text>
                </View>
                <Text style={styles.scoreNumber}>{score}/100</Text>
              </View>

              <View style={styles.factorsList}>
                {factors.map((f, i) => (
                  <View key={i} style={styles.factorItem}>
                    <Text style={styles.factorLabel}>{f.label}</Text>
                    <Text
                      style={[
                        styles.factorPoints,
                        f.points > 0 ? styles.positivePoints : f.points < 0 ? styles.negativePoints : {},
                      ]}
                    >
                      {f.points > 0 ? `+${f.points}` : f.points}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Description */}
            {task.description ? (
              <View style={styles.notesBox}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{task.description}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.toggleBtn, task.completed && styles.reopenBtn]}
              onPress={() => {
                onToggle(task.id)
                onClose()
              }}
            >
              <Check size={18} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.toggleBtnText}>
                {task.completed ? 'Reopen Task' : 'Complete Task'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                onDelete(task.id)
                onClose()
              }}
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoryPill: {
    backgroundColor: '#eef0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5b5bd6',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 26,
    marginBottom: 12,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  metaBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  scoreCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5b5bd6',
  },
  factorsList: {
    gap: 6,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  factorPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  positivePoints: {
    color: '#10b981',
  },
  negativePoints: {
    color: '#ef4444',
  },
  notesBox: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  reopenBtn: {
    backgroundColor: '#5b5bd6',
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
