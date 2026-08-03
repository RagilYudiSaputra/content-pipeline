import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Inisialisasi Firebase Admin hanya sekali
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();

    if (!bodyText) {
      return NextResponse.json(
        {
          success: false,
          message: "Body permintaan tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, role } = JSON.parse(bodyText);

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama lengkap, email, dan password wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal 6 karakter.",
        },
        { status: 400 }
      );
    }

    // Membuat user Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Menyimpan data user ke Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      fullName,
      email,
      role: role || "designer",
      avatar: "",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengguna berhasil dibuat.",
        uid: userRecord.uid,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error pada /api/users/create:", error);

    let errorMessage = "Terjadi kesalahan pada server.";

    switch (error.code) {
      case "auth/email-already-exists":
        errorMessage = "Email sudah terdaftar.";
        break;

      case "auth/invalid-email":
        errorMessage = "Format email tidak valid.";
        break;

      case "auth/weak-password":
        errorMessage = "Password terlalu lemah.";
        break;

      default:
        if (error.message) {
          errorMessage = error.message;
        }
        break;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}