import React, { useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Plus, Search, X, Filter } from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'
import { TaskCard } from '../components/TaskCard.js'
import { TaskDetailModal } from '../components/TaskDetailModal.js'
import { TaskFormModal } from '../components/TaskFormModal.js'
import { analyze, sortByPriority } from '../lib/priority.js'
import { isOverdue, daysUntil } from '../lib/date.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'high', label: 'High Priority' },
  { key: 'today', label: 'Due Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'Academic', label: 'Academic' },
  { key: 'Personal', label: 'Personal' },
  { key: 'favorites', label: 'Favorites' },
]

export function TasksScreen() {
  const { tasks, addTask, toggleComplete, deleteTask, toggleFavorite } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [detailTask, setDetailTask] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const visibleTasks = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tasks.filter((t) => {
      // Query filter
      if (
        term &&
        !t.title.toLowerCase().includes(term) &&
        !t.description?.toLowerCase().includes(term) &&
        !t.category?.toLowerCase().includes(term)
      ) {
        return false
      }

      // Tab filter
      if (filter === 'all') return true
      if (filter === 'pending') return !t.completed
      if (filter === 'completed') return t.completed
      if (filter === 'today') return !t.completed && daysUntil(t) === 0
      if (filter === 'overdue') return isOverdue(t)
      if (filter === 'high') return !t.completed && analyze(t).priority === 'high'
      if (filter === 'favorites') return t.favorite
      if (filter === 'Academic') return t.category === 'Academic'
      if (filter === 'Personal') return t.category === 'Personal'

      return true
    })
  }, [tasks, query, filter])

  const sortedTasks = useMemo(() => sortByPriority(visibleTasks), [visibleTasks])

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, notes, or category..."
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Horizontal List */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Tasks List */}
      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={toggleComplete}
            onSelect={(t) => setDetailTask(t)}
            onFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matching tasks</Text>
            <Text style={styles.emptySubtitle}>Try changing your filter or add a new task.</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setFormOpen(true)} activeOpacity={0.9}>
        <Plus size={26} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    color: '#0f172a',
  },
  filterContainer: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#5b5bd6',
    borderColor: '#5b5bd6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5b5bd6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5b5bd6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
})
