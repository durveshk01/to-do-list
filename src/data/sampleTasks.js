import { keyFromToday, keyOfNextWeekday } from '../lib/date.js'

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
  ...task,
})

/** Realistic student workload so the dashboard looks alive on first launch. */
export function seedTasks() {
  seq = 0
  return [
    make({
      title: 'Complete AI Project Report',
      description:
        'Finish the Artificial Intelligence mini-project, write the final report and submit the PDF on the college portal.',
      category: 'Academic',
      dueDate: keyFromToday(1),
      dueTime: '23:59',
      reminder: true,
      reminderOffset: '1d',
    }),
    make({
      title: 'DBMS Assignment',
      description: 'Solve normalization problems from Unit 3 and write the ER diagram for the library system.',
      category: 'Academic',
      dueDate: keyFromToday(3),
      dueTime: '18:00',
      reminder: true,
      reminderOffset: '1h',
    }),
    make({
      title: 'Study for Machine Learning Exam',
      description: 'Revise supervised learning, regression metrics and the neural network unit. Solve 2 past papers.',
      category: 'Exam Preparation',
      dueDate: keyFromToday(5),
      dueTime: '09:00',
      reminder: true,
      reminderOffset: '1d',
    }),
    make({
      title: 'Prepare Presentation',
      description: 'Build 12 slides for the software engineering seminar and rehearse the 8 minute delivery.',
      category: 'Project',
      dueDate: keyFromToday(7),
      dueTime: '14:30',
      reminder: true,
      reminderOffset: '30m',
    }),
    make({
      title: 'Buy Notebook',
      description: 'Pick up two ruled notebooks and highlighters from the stationery shop near campus.',
      category: 'Personal',
      dueDate: keyOfNextWeekday(0),
      dueTime: '17:00',
      reminder: false,
      reminderOffset: 'at',
    }),
    make({
      title: 'Submit Library Book Return',
      description: 'Return the borrowed Operating Systems textbook before the fine window starts.',
      category: 'Personal',
      dueDate: keyFromToday(0),
      dueTime: '19:00',
      reminder: true,
      reminderOffset: '1h',
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
    make({
      title: 'Group Project Sync Call',
      description: 'Weekly catch-up with the project team to split the remaining modules.',
      category: 'Project',
      dueDate: keyFromToday(-2),
      dueTime: '16:00',
      completed: true,
      completedAt: iso(2, 16, 20),
      reminder: false,
    }),
    make({
      title: 'Read Operating Systems Chapter 5',
      description: 'Deadlocks — read the chapter and highlight the key algorithms.',
      category: 'Exam Preparation',
      dueDate: keyFromToday(-3),
      dueTime: '21:00',
      completed: true,
      completedAt: iso(3, 21, 5),
      reminder: false,
    }),
    make({
      title: 'Pay Hostel Mess Bill',
      description: 'Clear the monthly mess dues at the accounts office.',
      category: 'Personal',
      dueDate: keyFromToday(-4),
      dueTime: '13:00',
      completed: true,
      completedAt: iso(4, 12, 40),
      reminder: false,
    }),
    make({
      title: 'Compiler Design Lab Record',
      description: 'Complete the lab record for experiments 5 to 8 and get it signed.',
      category: 'Academic',
      dueDate: keyFromToday(-5),
      dueTime: '15:00',
      completed: true,
      completedAt: iso(5, 14, 55),
      reminder: false,
    }),
  ]
}
