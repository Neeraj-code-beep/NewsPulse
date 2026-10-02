import { useSyncExternalStore } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/firebase.config';
import { addFavourite, removeFavourite } from '../services/Favourites';

const listeners = new Set();
const initialState = {
  user: null,
  favourites: [],
  authLoading: true,
  loading: true,
  error: null
};

let state = initialState;
let unsubscribeAuth = null;
let unsubscribeFavourites = null;
let activeUid = null;

const notify = () => listeners.forEach((listener) => listener());

const updateState = (nextState) => {
  state = nextState;
  notify();
};

const stopFavouritesListener = () => {
  unsubscribeFavourites?.();
  unsubscribeFavourites = null;
  activeUid = null;
};

const startStore = () => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    stopFavouritesListener();

    if (!user) {
      updateState({
        user: null,
        favourites: [],
        authLoading: false,
        loading: false,
        error: null
      });
      return;
    }

    activeUid = user.uid;
    updateState({
      user,
      favourites: [],
      authLoading: false,
      loading: true,
      error: null
    });

    const uid = user.uid;
    const reference = doc(firestore, 'favourites', uid);
    unsubscribeFavourites = onSnapshot(reference, (snapshot) => {
      if (activeUid !== uid || auth.currentUser?.uid !== uid) return;
      const favourites = snapshot.exists() && Array.isArray(snapshot.data()?.favourites)
        ? snapshot.data().favourites
        : [];
      updateState({ user, favourites, authLoading: false, loading: false, error: null });
    }, (error) => {
      if (activeUid !== uid || auth.currentUser?.uid !== uid) return;
      updateState({ user, favourites: [], authLoading: false, loading: false, error });
    });
  });
};

const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) startStore();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unsubscribeAuth?.();
      unsubscribeAuth = null;
      stopFavouritesListener();
      state = initialState;
    }
  };
};

const getSnapshot = () => state;

export const useFavourites = () => {
  const currentState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...currentState,
    addFavourite: (article) => addFavourite(article, currentState.user?.uid),
    removeFavourite: (article) => removeFavourite(article, currentState.user?.uid)
  };
};
