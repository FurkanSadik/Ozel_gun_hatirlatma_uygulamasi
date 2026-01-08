import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

export async function addEvent(uid, data) {
  const ref = collection(db, "users", uid, "events");
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function getEvents(uid) {
  const ref = collection(db, "users", uid, "events");
  const q = query(ref, orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteEvent(uid, eventId) {
  const ref = doc(db, "users", uid, "events", eventId);
  await deleteDoc(ref);
}
