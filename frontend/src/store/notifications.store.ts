import { create } from 'zustand'

export type NotifType =
  | 'info' | 'success' | 'warning' | 'achievement'
  | 'streak' | 'maya' | 'reminder' | 'xp'

export interface Notification {
  id:        string
  type:      NotifType
  title:     string
  body?:     string
  read:      boolean
  createdAt: string
  href?:     string
  meta?:     Record<string, unknown>
}

interface State {
  items:      Notification[]
  panelOpen:  boolean
}

interface Actions {
  add:          (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markRead:     (id: string) => void
  markAllRead:  () => void
  remove:       (id: string) => void
  clearAll:     () => void
  setPanelOpen: (v: boolean) => void
  togglePanel:  () => void
}

export const useNotificationsStore = create<State & Actions>()((set) => ({
  items:     [],
  panelOpen: false,

  add: (n) =>
    set(s => ({
      items: [
        {
          ...n,
          id:        crypto.randomUUID(),
          read:      false,
          createdAt: new Date().toISOString(),
        },
        ...s.items,
      ].slice(0, 50),
    })),

  markRead:    (id) => set(s => ({ items: s.items.map(n => n.id === id ? { ...n, read: true }  : n) })),
  markAllRead: ()   => set(s => ({ items: s.items.map(n => ({ ...n, read: true })) })),
  remove:      (id) => set(s => ({ items: s.items.filter(n => n.id !== id) })),
  clearAll:    ()   => set({ items: [] }),
  setPanelOpen:(v)  => set({ panelOpen: v }),
  togglePanel: ()   => set(s => ({ panelOpen: !s.panelOpen })),
}))

export const useUnreadCount = () =>
  useNotificationsStore(s => s.items.filter(n => !n.read).length)
