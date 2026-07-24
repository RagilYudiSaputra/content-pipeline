import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      uid,
      ...(docSnap.data() as Omit<UserProfile, "uid">),
    };
  } catch (error) {
    console.error("Error mengambil data user:", error);
    return null;
  }
}