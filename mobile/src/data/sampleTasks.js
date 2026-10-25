import { keyFromToday } from '../lib/date.js'

const iso = (daysAgo, h, m) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

let seq = 0
const make = (task) => ({
  id: `seed-${++seq}`,
  description: '',
  dueTime: '23:59',
  priorityMode: 'auto',
  reminder: true,
  reminderOffset: '1h',
  completed: false,
  completedAt: null,
  createdAt: iso(3, 9, 15),
  updatedAt: iso(3, 9, 15),
  tags: [],
  subtasks: [],
  ...task,
})

export function seedTasks() {
  seq = 0
  return [
    make({
      title: 'Complete AI Project Report',
      description: 'Finish the Artificial Intelligence mini-project, write the final report and submit the PDF on the college portal.',
      category: 'Academic',
      dueDate: keyFromToday(1),
      dueTime: '23:59',
      estimatedMinutes: 60,
      reminder: true,
      tags: ['ai', 'report'],
    }),
    make({
      title: 'DBMS Assignment',
      description: 'Solve normalization problems from Unit 3 and write the ER diagram for the library system.',
      category: 'Academic',
      dueDate: keyFromToday(3),
      dueTime: '18:00',
      estimatedMinutes: 45,
      reminder: true,
      tags: ['dbms'],
    }),
    make({
      title: 'Study for Machine Learning Exam',
      description: 'Revise supervised learning, regression metrics and the neural network unit. Solve 2 past papers.',
      category: 'Exam Preparation',
      dueDate: keyFromToday(5),
      dueTime: '09:00',
      estimatedMinutes: 90,
      reminder: true,
      tags: ['ml', 'exam'],
    }),
    make({
      title: 'Prepare Presentation',
      description: 'Build 12 slides for the software engineering seminar and rehearse the 8 minute delivery.',
      category: 'Project',
      dueDate: keyFromToday(7),
      dueTime: '14:30',
      estimatedMinutes: 40,
      reminder: true,
      tags: ['slides'],
    }),
    make({
      title: 'Submit Library Book Return',
      description: 'Return the borrowed Operating Systems textbook before the fine window starts.',
      category: 'Personal',
      dueDate: keyFromToday(0),
      dueTime: '19:00',
      estimatedMinutes: 15,
      reminder: true,
    }),
    make({
      title: 'Mathematics Assignment',
      description: 'Complete the linear algebra problem set from chapter 4.',
      category: 'Academic',
      dueDate: keyFromToday(-1),
      dueTime: '11:00',
      completed: true,
      completedAt: iso(0, 10, 30),
      reminder: false,
    }),
    make({
      title: 'DBMS Notes',
      description: 'Write short notes for transactions and concurrency control.',
      category: 'Academic',
      dueDate: keyFromToday(-1),
      dueTime: '20:00',
      completed: true,
      completedAt: iso(1, 19, 45),
      reminder: false,
    }),
  ]
}
