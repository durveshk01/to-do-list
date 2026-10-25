import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppStore.jsx'
import { TaskUIProvider } from './store/TaskUI.jsx'
import { AppLayout } from './components/AppLayout.jsx'
import { Toasts } from './components/Toasts.jsx'
const Login = lazy(() => import('./pages/Login.jsx').then((module) => ({ default: module.Login })))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then((module) => ({ default: module.Dashboard })))
const AllTasks = lazy(() => import('./pages/AllTasks.jsx').then((module) => ({ default: module.AllTasks })))
const AddTask = lazy(() => import('./pages/AddTask.jsx').then((module) => ({ default: module.AddTask })))
const SmartPriority = lazy(() => import('./pages/SmartPriority.jsx').then((module) => ({ default: module.SmartPriority })))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx').then((module) => ({ default: module.CalendarPage })))
const Notifications = lazy(() => import('./pages/Notifications.jsx').then((module) => ({ default: module.Notifications })))
const Analytics = lazy(() => import('./pages/Analytics.jsx').then((module) => ({ default: module.Analytics })))
const Completed = lazy(() => import('./pages/Completed.jsx').then((module) => ({ default: module.Completed })))
const Settings = lazy(() => import('./pages/Settings.jsx').then((module) => ({ default: module.Settings })))
const Board = lazy(() => import('./pages/Board.jsx').then((module) => ({ default: module.Board })))
const Focus = lazy(() => import('./pages/Focus.jsx').then((module) => ({ default: module.Focus })))
const Archive = lazy(() => import('./pages/Archive.jsx').then((module) => ({ default: module.Archive })))


function RequireAuth({ children }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="font-display text-[4rem] font-extrabold leading-none text-accent">404</p>
        <h1 className="mt-2 font-display text-[1.4rem] font-extrabold text-ink">That page doesn't exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-[0.86rem] text-ink-2">
          The link may be out of date. Your tasks are all safe on the dashboard.
        </p>
        <a href="/dashboard" className="btn btn-primary mt-5 inline-flex">
          Back to dashboard
        </a>
      </div>
    </div>
  )
}

function PageLoading() {
  return <div className="grid min-h-[50vh] place-items-center" role="status"><span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/25 border-t-accent" /><span className="sr-only">Loading page</span></div>
}

export default function App() {
  return (
    <AppProvider>
      <TaskUIProvider>
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<AllTasks />} />
            <Route path="/tasks/completed" element={<Completed />} />
            <Route path="/board" element={<Board />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/add" element={<AddTask />} />
            <Route path="/priority" element={<SmartPriority />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/completed" element={<Completed />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>

        <Toasts />
      </TaskUIProvider>
    </AppProvider>
  )
}
