import { create } from 'zustand'

interface State {
  commandOpen: boolean
  mayaOpen:    boolean
  activeModal: string | null
}

interface Actions {
  setCommandOpen: (v: boolean) => void
  toggleCommand:  () => void
  setMayaOpen:    (v: boolean) => void
  toggleMaya:     () => void
  openModal:      (id: string) => void
  closeModal:     () => void
}

export const useUIStore = create<State & Actions>()((set) => ({
  commandOpen: false,
  mayaOpen:    false,
  activeModal: null,

  setCommandOpen: (v) => set({ commandOpen: v }),
  toggleCommand:  ()  => set(s => ({ commandOpen: !s.commandOpen })),
  setMayaOpen:    (v) => set({ mayaOpen: v }),
  toggleMaya:     ()  => set(s => ({ mayaOpen: !s.mayaOpen })),
  openModal:      (id)=> set({ activeModal: id }),
  closeModal:     ()  => set({ activeModal: null }),
}))
