import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/firebase.config';
import { createUniqueIdentifier } from '../utils';

const getFavouritesRef = (expectedUid) => {
  const uid = auth.currentUser?.uid;
  if (!uid || (expectedUid && expectedUid !== uid)) {
    throw new Error('Authentication required');
  }

  return doc(firestore, 'favourites', uid);
};

export const addFavourite = async (article, expectedUid) => {
  const reference = getFavouritesRef(expectedUid);
  const favourite = {
    id: createUniqueIdentifier(article),
    news: { ...article }
  };

  await setDoc(reference, { favourites: arrayUnion(favourite) }, { merge: true });
};

export const removeFavourite = async (article, expectedUid) => {
  const reference = getFavouritesRef(expectedUid);
  const favourite = {
    id: createUniqueIdentifier(article),
    news: { ...article }
  };

  await updateDoc(reference, { favourites: arrayRemove(favourite) });
};
