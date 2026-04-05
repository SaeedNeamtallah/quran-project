"use client";

import { useEffect, useState } from "react";

interface PersistedStoreApi {
  persist?: {
    hasHydrated: () => boolean;
    onHydrate: (listener: () => void) => () => void;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

export function usePersistedStoreHydrated<TStore extends PersistedStoreApi>(store: TStore) {
  const [hydrated, setHydrated] = useState(store.persist?.hasHydrated() ?? true);

  useEffect(() => {
    if (!store.persist) {
      setHydrated(true);
      return;
    }

    const unsubscribeHydrate = store.persist.onHydrate(() => setHydrated(false));
    const unsubscribeFinish = store.persist.onFinishHydration(() => setHydrated(true));

    setHydrated(store.persist.hasHydrated());

    return () => {
      unsubscribeHydrate();
      unsubscribeFinish();
    };
  }, [store]);

  return hydrated;
}
