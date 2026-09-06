import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppStore.jsx'
import { TaskUIProvider } from './store/TaskUI.jsx'
import { AppLayout } from './components/AppLayout.jsx'
import { Toasts } from './components/Toasts.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { AllTasks } from './pages/AllTasks.jsx'
import { AddTask } from './pages/AddTask.jsx'
import { SmartPriority } from './pages/SmartPriority.jsx'
import { CalendarPage } from './pages/CalendarPage.jsx'
import { Notifications } from './pages/Notifications.jsx'
import { Analytics } from './pages/Analytics.jsx'
import { Completed } from './pages/Completed.jsx'
import { Settings } from './pages/Settings.jsx'

/** Sends signed-out visitors to the login screen, remembering where they wanted to go. */
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

export default function App() {
  return (
    <AppProvider>
      <TaskUIProvider>
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

        <Toasts />
      </TaskUIProvider>
    </AppProvider>
  )
}
