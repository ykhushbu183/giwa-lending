import { useState, useEffect, useCallback } from "react"

type ToastType = "pending" | "success" | "error"
interface ToastItem {
  id: number
  message: string
  type: ToastType
  txHash?: string
}

let toastId = 0
const listeners: Set<(t: ToastItem) => void> = new Set()

export function toast(message: string, type: ToastType, txHash?: string): number {
  const id = ++toastId
  const item: ToastItem = { id, message, type, txHash }
  listeners.forEach(fn => fn(item))
  return id
}

export function updateToast(id: number, message: string, type: ToastType, txHash?: string) {
  const item: ToastItem = { id, message, type, txHash }
  listeners.forEach(fn => fn(item))
}

export function dismissToast(id: number) {
  dismissListeners.forEach(fn => fn(id))
}

const dismissListeners: Set<(id: number) => void> = new Set()

export default function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  const addItem = useCallback((item: ToastItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.map(i => i.id === item.id ? item : i)
      }
      return [...prev, item]
    })
    if (item.type !== "pending") {
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== item.id))
      }, 3000)
    }
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  useEffect(() => {
    listeners.add(addItem)
    return () => { listeners.delete(addItem) }
  }, [addItem])

  useEffect(() => {
    dismissListeners.add(removeItem)
    return () => { dismissListeners.delete(removeItem) }
  }, [removeItem])

  return (
    <div style={{
      position: "fixed", top: 80, right: 16, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 8,
      maxWidth: 360, width: "100%", pointerEvents: "none",
    }}>
      {items.map(item => (
        <div key={item.id} className="animate-scale"
          style={{
            pointerEvents: "auto",
            background: "var(--bg-card)",
            border: `1px solid ${
              item.type === "success" ? "var(--accent-green)" :
              item.type === "error" ? "var(--accent-red)" :
              "var(--accent-yellow)"
            }`,
            borderRadius: 10,
            padding: "12px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
          <span style={{ fontSize: 16, lineHeight: "20px", flexShrink: 0 }}>
            {item.type === "success" ? "✅" : item.type === "error" ? "❌" : "⏳"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
              {item.type === "success" ? "Success" : item.type === "error" ? "Failed" : "Pending"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: "16px" }}>{item.message}</div>
            {item.txHash && (
              <a href={`https://sepolia-explorer.giwa.io/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "var(--text-accent)", marginTop: 4, display: "inline-block" }}>
                View on Explorer →
              </a>
            )}
          </div>
          {item.type !== "pending" && (
            <button onClick={() => removeItem(item.id)}
              style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 2, fontSize: 14, lineHeight: "14px" }}>
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
