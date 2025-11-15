/**
 * Offline Queue - Retry failed actions automatically
 * Critical for mobile users with unstable connections
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  error?: string;
}

interface OfflineQueueState {
  queue: QueuedAction[];
  isProcessing: boolean;
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      addToQueue: (action) => {
        const newAction: QueuedAction = {
          ...action,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          retries: 0,
        };

        set((state) => ({
          queue: [...state.queue, newAction],
        }));

        console.log('[Queue] Action added:', newAction.type);

        // Try to process immediately
        get().processQueue();
      },

      processQueue: async () => {
        const { queue, isProcessing } = get();

        if (isProcessing || queue.length === 0) return;

        set({ isProcessing: true });

        console.log('[Queue] Processing', queue.length, 'actions');

        for (const action of queue) {
          try {
            // Execute action
            await executeAction(action);

            // Remove from queue on success
            get().removeFromQueue(action.id);

            console.log('[Queue] Action completed:', action.type);
          } catch (error) {
            console.error('[Queue] Action failed:', action.type, error);

            // Increment retries
            set((state) => ({
              queue: state.queue.map((a) =>
                a.id === action.id
                  ? {
                      ...a,
                      retries: a.retries + 1,
                      error: error instanceof Error ? error.message : 'Unknown error',
                    }
                  : a
              ),
            }));

            // Remove if max retries reached
            if (action.retries >= action.maxRetries) {
              console.error('[Queue] Max retries reached for:', action.type);
              get().removeFromQueue(action.id);
            }
          }
        }

        set({ isProcessing: false });
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== id),
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: 'offline-queue',
    }
  )
);

/**
 * Execute queued action
 */
async function executeAction(action: QueuedAction): Promise<void> {
  const { type, payload } = action;

  switch (type) {
    case 'UPDATE_PROFILE':
      // Call Supabase to update profile
      // await supabase.from('profiles').update(payload.data).eq('id', payload.userId);
      break;

    case 'CREATE_CLIENT':
      // Call edge function to create client
      // await supabase.functions.invoke('create-client', { body: payload });
      break;

    case 'WITHDRAW_REQUEST':
      // Call withdrawal endpoint
      // await supabase.from('saques').insert(payload);
      break;

    default:
      console.warn('[Queue] Unknown action type:', type);
  }
}

/**
 * Auto-process queue when online
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Queue] Back online, processing queue');
    useOfflineQueue.getState().processQueue();
  });
}

/**
 * Helper: Add action with type safety
 */
export const QueueActions = {
  updateProfile: (userId: string, data: any) => ({
    type: 'UPDATE_PROFILE',
    payload: { userId, data },
    maxRetries: 3,
  }),

  createClient: (clientData: any) => ({
    type: 'CREATE_CLIENT',
    payload: clientData,
    maxRetries: 5,
  }),

  requestWithdrawal: (amount: number) => ({
    type: 'WITHDRAW_REQUEST',
    payload: { amount },
    maxRetries: 3,
  }),
};

export default useOfflineQueue;
