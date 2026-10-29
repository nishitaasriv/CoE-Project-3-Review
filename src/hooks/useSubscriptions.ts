import { useCallback, useEffect, useState } from 'react';
import { Subscription } from '../types/subscription';
import { autoRollSubscriptions } from '../lib/subscriptions';
import { loadSubscriptions, saveSubscriptions } from '../lib/storage';
import { getDemoSubscriptions } from '../data/demo-data';
import { useAuth } from './useAuth';

export function useSubscriptions() {
  const { user } = useAuth();
  const userId = user?.id;

  const [subscriptions, setSubscriptionsState] = useState<Subscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load subscriptions & auto-roll renewals
  useEffect(() => {
    const rawList = loadSubscriptions(userId);

    // If user is guest or first-time and empty, offer demo data or load demo data for guest
    let initialList = rawList;
    if (rawList.length === 0 && userId === 'guest') {
      initialList = getDemoSubscriptions();
      saveSubscriptions(initialList, userId);
    }

    const { updatedSubscriptions, hasChanges } = autoRollSubscriptions(initialList);
    if (hasChanges) {
      saveSubscriptions(updatedSubscriptions, userId);
    }

    setSubscriptionsState(updatedSubscriptions);
    setIsLoaded(true);
  }, [userId]);

  const updateAllSubscriptions = useCallback(
    (newList: Subscription[]) => {
      setSubscriptionsState(newList);
      saveSubscriptions(newList, userId);
    },
    [userId]
  );

  const addSubscription = useCallback(
    (newSub: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const created: Subscription = {
        ...newSub,
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: now,
        updatedAt: now,
      };

      setSubscriptionsState((prev) => {
        const next = [created, ...prev];
        saveSubscriptions(next, userId);
        return next;
      });
      return created;
    },
    [userId]
  );

  const editSubscription = useCallback(
    (id: string, updates: Partial<Subscription>) => {
      setSubscriptionsState((prev) => {
        const next = prev.map((s) => {
          if (s.id !== id) return s;

          // If price changed, record in priceHistory
          let updatedHistory = [...(s.priceHistory || [])];
          if (updates.price !== undefined && updates.price !== s.price) {
            updatedHistory.push({
              id: 'ph_' + Date.now(),
              date: new Date().toISOString().split('T')[0],
              price: updates.price,
              currency: updates.currency || s.currency,
              reason: updates.notes || 'Price adjustment',
            });
          }

          return {
            ...s,
            ...updates,
            priceHistory: updatedHistory,
            updatedAt: new Date().toISOString(),
          };
        });

        saveSubscriptions(next, userId);
        return next;
      });
    },
    [userId]
  );

  const deleteSubscription = useCallback(
    (id: string) => {
      setSubscriptionsState((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveSubscriptions(next, userId);
        return next;
      });
    },
    [userId]
  );

  const markAsCancelled = useCallback(
    (id: string, proof?: { referenceNumber?: string; note?: string; imageDataUri?: string }) => {
      setSubscriptionsState((prev) => {
        const next = prev.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            status: 'cancelled' as const,
            proofOfCancellation: {
              cancelledAt: new Date().toISOString(),
              referenceNumber: proof?.referenceNumber,
              note: proof?.note,
              imageDataUri: proof?.imageDataUri,
            },
            updatedAt: new Date().toISOString(),
          };
        });

        saveSubscriptions(next, userId);
        return next;
      });
    },
    [userId]
  );

  const markAsPaused = useCallback(
    (id: string) => {
      editSubscription(id, { status: 'paused' });
    },
    [editSubscription]
  );

  const markAsActive = useCallback(
    (id: string) => {
      editSubscription(id, { status: 'active' });
    },
    [editSubscription]
  );

  const loadSampleData = useCallback(() => {
    const demo = getDemoSubscriptions();
    setSubscriptionsState(demo);
    saveSubscriptions(demo, userId);
  }, [userId]);

  const clearAllData = useCallback(() => {
    setSubscriptionsState([]);
    saveSubscriptions([], userId);
  }, [userId]);

  return {
    subscriptions,
    isLoaded,
    addSubscription,
    editSubscription,
    deleteSubscription,
    markAsCancelled,
    markAsPaused,
    markAsActive,
    loadSampleData,
    clearAllData,
    updateAllSubscriptions,
  };
}
