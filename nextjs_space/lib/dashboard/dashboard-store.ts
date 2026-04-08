/**
 * DASHBOARD STORE - Zustand store quản lý dashboard layout
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayout, WidgetConfig } from './widget-registry';
import { generateDefaultLayout, getAvailableWidgets } from './widget-registry';

interface DashboardState {
  // Current layout
  currentLayout: DashboardLayout | null;
  
  // Saved layouts
  savedLayouts: DashboardLayout[];
  
  // Edit mode
  isEditing: boolean;
  
  // Selected widget for drag
  selectedWidget: string | null;
  
  // Actions
  setCurrentLayout: (layout: DashboardLayout) => void;
  initializeLayout: (userFunctions: string[]) => void;
  saveLayout: (layout: DashboardLayout) => void;
  deleteLayout: (layoutId: string) => void;
  toggleEditMode: () => void;
  setSelectedWidget: (widgetId: string | null) => void;
  
  // Widget actions
  addWidget: (widgetId: string, x: number, y: number) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetPosition: (widgetId: string, x: number, y: number, w: number, h: number) => void;
  resetToDefault: (userFunctions: string[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      currentLayout: null,
      savedLayouts: [],
      isEditing: false,
      selectedWidget: null,
      
      setCurrentLayout: (layout) => set({ currentLayout: layout }),
      
      initializeLayout: (userFunctions) => {
        const current = get().currentLayout;
        if (!current) {
          const defaultLayout = generateDefaultLayout(userFunctions);
          set({ currentLayout: defaultLayout });
        }
      },
      
      saveLayout: (layout) => {
        const { savedLayouts } = get();
        const existingIndex = savedLayouts.findIndex(l => l.id === layout.id);
        if (existingIndex >= 0) {
          savedLayouts[existingIndex] = layout;
          set({ savedLayouts: [...savedLayouts] });
        } else {
          set({ savedLayouts: [...savedLayouts, layout] });
        }
      },
      
      deleteLayout: (layoutId) => {
        set(state => ({
          savedLayouts: state.savedLayouts.filter(l => l.id !== layoutId)
        }));
      },
      
      toggleEditMode: () => set(state => ({ isEditing: !state.isEditing })),
      
      setSelectedWidget: (widgetId) => set({ selectedWidget: widgetId }),
      
      addWidget: (widgetId, x, y) => {
        const { currentLayout } = get();
        if (!currentLayout) return;
        
        // Check if widget already exists
        if (currentLayout.widgets.find(w => w.widgetId === widgetId)) return;
        
        const newWidgets = [
          ...currentLayout.widgets,
          { widgetId, x, y, w: 3, h: 2 }
        ];
        
        set({
          currentLayout: { ...currentLayout, widgets: newWidgets }
        });
      },
      
      removeWidget: (widgetId) => {
        const { currentLayout } = get();
        if (!currentLayout) return;
        
        set({
          currentLayout: {
            ...currentLayout,
            widgets: currentLayout.widgets.filter(w => w.widgetId !== widgetId)
          }
        });
      },
      
      updateWidgetPosition: (widgetId, x, y, w, h) => {
        const { currentLayout } = get();
        if (!currentLayout) return;
        
        const widgets = currentLayout.widgets.map(widget =>
          widget.widgetId === widgetId
            ? { ...widget, x, y, w, h }
            : widget
        );
        
        set({ currentLayout: { ...currentLayout, widgets } });
      },
      
      resetToDefault: (userFunctions) => {
        const defaultLayout = generateDefaultLayout(userFunctions);
        set({ currentLayout: defaultLayout });
      },
    }),
    {
      name: 'hvhc-dashboard-layout',
      partialize: (state) => ({
        currentLayout: state.currentLayout,
        savedLayouts: state.savedLayouts,
      }),
    }
  )
);
