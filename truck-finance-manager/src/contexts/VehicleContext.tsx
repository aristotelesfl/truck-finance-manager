import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { subscribeVehicles } from '../firebase/firestore'
import { useAuth } from './AuthContext'
import type { Vehicle } from '../types'

const STORAGE_KEY = 'truck-finance:active-vehicle-id'

interface VehicleContextValue {
  vehicles: Vehicle[]
  loading: boolean
  activeVehicleId: string | null
  activeVehicle: Vehicle | null
  setActiveVehicleId: (id: string) => void
}

const VehicleContext = createContext<VehicleContextValue | null>(null)

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  )

  useEffect(() => {
    if (!user) {
      setVehicles([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeVehicles(user.uid, (nextVehicles) => {
      setVehicles(nextVehicles)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  const selectVehicle = (id: string | null) => {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
    setActiveVehicleIdState(id)
  }

  useEffect(() => {
    if (loading) return
    if (vehicles.length === 0) {
      selectVehicle(null)
      return
    }
    const stillExists = vehicles.some((v) => v.id === activeVehicleId)
    if (!stillExists) {
      selectVehicle(vehicles[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, loading])

  const setActiveVehicleId = (id: string) => selectVehicle(id)

  const activeVehicle = useMemo(
    () => vehicles.find((v) => v.id === activeVehicleId) ?? null,
    [vehicles, activeVehicleId],
  )

  return (
    <VehicleContext value={{ vehicles, loading, activeVehicleId, activeVehicle, setActiveVehicleId }}>
      {children}
    </VehicleContext>
  )
}

export function useVehicle(): VehicleContextValue {
  const ctx = use(VehicleContext)
  if (!ctx) throw new Error('useVehicle deve ser usado dentro de VehicleProvider')
  return ctx
}
