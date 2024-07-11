import React, {useRef, createContext, useContext, useCallback, useEffect, useSyncExternalStore } from "react";

type Store = {first: string; last:string;};

const useStoreData = (): {
  get: () => Store;
  set: (value: Partial<Store>) => void;
  subscribe: (cb: () => void) => () => void;
} => {
  const store = useRef({
    first: "",
    last: ""
  });
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


const TextInput = ({ value }: { value: "first" | "last" }) => {
  const [fieldValue, setStore] = useStore((store) => store[value])!;
  return (
    <div className="field">
      {value}: 
      <input 
        value={fieldValue}
        onChange={(e) => {
        setStore({[value]: e.target.value})
      }}/>
    </div>
  );
};

const Display = ({ value }: { value: "first" | "last" }) => {
  const [fieldValue] = useStore((store) => store[value])!;
  return (
    <div className="value">
      {value}: {fieldValue}
    </div>
  );
};

const FormContainer = () => {
  return (
    <div className="container">
      <h5>FormContainer</h5>
      <TextInput value="first" />
      <TextInput value="last" />
    </div>
  );
};

const DisplayContainer = () => {
  return (
    <div className="container">
      <h5>DisplayContainer</h5>
      <Display value="first" />
      <Display value="last" />
    </div>
  );
};

const ContentContainer = () => {
  return (
    <div className="container">
      <h5>ContentContainer</h5>
      <FormContainer />
      <DisplayContainer />
    </div>
  );
};

function App() {  
  return (
    <StoreContextProvider>
    <div className="container">
      <h5>App</h5>
      <ContentContainer />
    </div>
    </StoreContextProvider>
  );
}

export default App;
