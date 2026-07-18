import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VehicleProvider } from './contexts/VehicleContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute'
import { AppShellLayout } from './components/layout/AppShell'
import { LoginScreen } from './screens/LoginScreen'
import { SignupScreen } from './screens/SignupScreen'
import { HomeScreen } from './screens/HomeScreen'
import { VehiclesScreen } from './screens/VehiclesScreen'
import { TagsScreen } from './screens/TagsScreen'
import { TransactionFormScreen } from './screens/TransactionFormScreen'
import { TransactionHistoryScreen } from './screens/TransactionHistoryScreen'

function VehicleLayout() {
  return (
    <VehicleProvider>
      <Outlet />
    </VehicleProvider>
  )
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signup" element={<SignupScreen />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<VehicleLayout />}>
              <Route element={<AppShellLayout />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/historico" element={<TransactionHistoryScreen />} />
                <Route path="/vehicles" element={<VehiclesScreen />} />
                <Route path="/tags" element={<TagsScreen />} />
              </Route>
              <Route path="/transactions/new" element={<TransactionFormScreen />} />
              <Route path="/transactions/:id/edit" element={<TransactionFormScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}

export default App
