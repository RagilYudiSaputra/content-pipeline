import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Content } from "@/types/content";

const COLLECTION_NAME = "contents";

export async function getContents(): Promise<Content[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Omit<Content, "id">),
  }));
}

export async function getContentById(
  id: string
): Promise<Content | null> {
  const document = await getDoc(
    doc(db, COLLECTION_NAME, id)
  );

  if (!document.exists()) return null;

  return {
    id: document.id,
    ...(document.data() as Omit<Content, "id">),
  };
}

export async function createContent(
  data: Omit<Content, "id">
) {
  return await addDoc(
    collection(db, COLLECTION_NAME),
    data
  );
}

export async function updateContent(
  id: string,
  data: Partial<Content>
) {
  return await updateDoc(
    doc(db, COLLECTION_NAME, id),
    data
  );
}

export async function deleteContent(id: string) {
  return await deleteDoc(
    doc(db, COLLECTION_NAME, id)
  );
}