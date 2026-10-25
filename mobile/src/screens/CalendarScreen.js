import React, { useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native'
import { useApp } from '../context/AppContext.js'
import { TaskCard } from '../components/TaskCard.js'
import { TaskDetailModal } from '../components/TaskDetailModal.js'
import { TaskFormModal } from '../components/TaskFormModal.js'
import { toKey, monthName, weekdayShort } from '../lib/date.js'

export function CalendarScreen() {
  const { tasks, addTask, toggleComplete, deleteTask, toggleFavorite } = useApp()
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(toKey(today))
  const [cursorMonth, setCursorMonth] = useState(today.getMonth())
  const [cursorYear, setCursorYear] = useState(today.getFullYear())
  const [detailTask, setDetailTask] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  // Generate days in month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(cursorYear, cursorMonth + 1, 0).getDate()
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(cursorYear, cursorMonth, i + 1)
      const key = toKey(d)
      const taskCount = tasks.filter((t) => t.dueDate === key && !t.completed).length
      return {
        day: i + 1,
        key,
        date: d,
        weekday: weekdayShort(d.getDay()),
        taskCount,
        isToday: key === toKey(today),
      }
    })
  }, [cursorYear, cursorMonth, tasks])

  const dateTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === selectedDate)
  }, [tasks, selectedDate])

  const shiftMonth = (delta) => {
    const next = new Date(cursorYear, cursorMonth + delta, 1)
    setCursorYear(next.getFullYear())
    setCursorMonth(next.getMonth())
  }

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(-1)}>
          <ChevronLeft size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.monthTitleBox}>
          <Text style={styles.monthTitle}>
            {monthName(cursorMonth)} {cursorYear}
          </Text>
        </View>

        <TouchableOpacity style={styles.navBtn} onPress={() => shiftMonth(1)}>
          <ChevronRight size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Days Horizontal Carousel */}
      <View style={styles.daysContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={daysInMonth}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const isSelected = item.key === selectedDate
            return (
              <TouchableOpacity
                style={[
                  styles.dayCard,
                  isSelected && styles.dayCardSelected,
                  item.isToday && !isSelected && styles.dayCardToday,
                ]}
                onPress={() => setSelectedDate(item.key)}
              >
                <Text style={[styles.dayWeekday, isSelected && styles.dayWeekdaySelected]}>
                  {item.weekday}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                  {item.day}
                </Text>
                {item.taskCount > 0 ? (
                  <View style={[styles.taskDot, isSelected && styles.taskDotSelected]} />
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </TouchableOpacity>
            )
          }}
          contentContainerStyle={styles.daysList}
        />
      </View>

      {/* Selected Date Header */}
      <View style={styles.dateBanner}>
        <Text style={styles.dateBannerTitle}>
          Deadlines for {selectedDate}
        </Text>
        <Text style={styles.dateBannerCount}>
          {dateTasks.length} task{dateTasks.length === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Tasks Due on Selected Date */}
      <FlatList
        data={dateTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={toggleComplete}
            onSelect={(t) => setDetailTask(t)}
            onFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={styles.tasksList}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <CalendarDays size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No deadlines on this day</Text>
            <Text style={styles.emptySubtitle}>Enjoy your free schedule or plan ahead.</Text>
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  daysContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  daysList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayCard: {
    width: 50,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardToday: {
    borderColor: '#5b5bd6',
  },
  dayCardSelected: {
    backgroundColor: '#5b5bd6',
    borderColor: '#5b5bd6',
  },
  dayWeekday: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dayWeekdaySelected: {
    color: '#e0e7ff',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  dayNumSelected: {
    color: '#ffffff',
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5b5bd6',
    marginTop: 4,
  },
  taskDotSelected: {
    backgroundColor: '#ffffff',
  },
  emptyDot: {
    width: 6,
    height: 6,
    marginTop: 4,
  },
  dateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  dateBannerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tasksList: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
})
