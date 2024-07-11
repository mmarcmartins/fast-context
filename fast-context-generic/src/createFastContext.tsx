import React, {useRef, createContext, useContext, useCallback, useEffect, useSyncExternalStore } from "react";

export default function createFastContext<Store>(initialState: Store){
    const useStoreData = (): {
        get: () => Store;
        set: (value: Partial<Store>) => void;
        subscribe: (cb: () => void) => () => void;
      } => {
        const store = useRef(initialState);
        
        const subscribers = useRef(new Set< () => void >());
      
        const get = useCallback(() => store.current, []);
        const set = useCallback((value: Partial<Store>) => {
          store.current = {...store.current, ...value};
          subscribers.current.forEach(cb => cb());
        }, []);
      
        const subscribe = useCallback((cb: () => void) => {
          subscribers.current.add(cb);
          return () => subscribers.current.delete(cb);
        }, []);
      
        return {
          get,
          set,
          subscribe
        }
      }
      
      const StoreContext = createContext<ReturnType<typeof useStoreData> | null>(null);
      
      const StoreContextProvider = ({children}: {children: React.ReactNode}) => {
        const store = useStoreData();
        return (
          <StoreContext.Provider value={store}>
            {children}
          </StoreContext.Provider>
        )
      }
      
      const useStore = <SelectorOutput,>(
        selector: (store: Store) => SelectorOutput,
      ): [
        SelectorOutput,
        (value: Partial<Store>) => void,
      ] => {
        const store = useContext(StoreContext)!;
        const state = useSyncExternalStore(store.subscribe, () => selector(store.get()));
      
        if(!store){
          throw new Error('Store not found');
        }
      
        return [state, store.set];
      };      

      return {
        Provider: StoreContextProvider,
        useStore
      }
}

