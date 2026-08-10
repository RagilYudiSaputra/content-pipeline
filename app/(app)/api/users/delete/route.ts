import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json(
        { message: "User ID atau Email wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Hapus dari Firebase Authentication (Coba via UID, jika gagal cari via Email)
    try {
      if (userId) {
        await adminAuth.deleteUser(userId);
      }
    } catch (authError: any) {
      console.warn("Hapus via UID gagal, mencoba cari via Email...", authError.message);
      if (email) {
        const userRecord = await adminAuth.getUserByEmail(email);
        await adminAuth.deleteUser(userRecord.uid);
      }
    }

    // 2. Hapus dokumen dari Firestore Database
    if (userId) {
      await adminDb.collection("users").doc(userId).delete();
    }

    return NextResponse.json(
      { message: "User berhasil dihapus total dari Auth dan Firestore." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gagal menghapus user:", error);
    return NextResponse.json(
      { message: error.message || "Gagal menghapus user." },
      { status: 500 }
    );
  }
}