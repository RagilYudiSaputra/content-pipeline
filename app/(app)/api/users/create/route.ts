import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

if (!getApps().length) {
  // Membaca file service-account.json secara aman menggunakan filesystem Node.js
  const filePath = path.join(process.cwd(), "service-account.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const serviceAccount = JSON.parse(fileContent);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json(
        { message: "Body permintaan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const { fullName, email, password, role } = JSON.parse(bodyText);

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: "Nama lengkap, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: fullName,
    });

    await adminDb.collection("users").doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: role || "designer",
      avatar: "",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengguna baru berhasil dibuat!",
        uid: userRecord.uid,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error pada /api/users/create:", error);

    let errorMessage = "Terjadi kesalahan pada server.";
    if (error.code === "auth/email-already-exists") {
      errorMessage = "Email ini sudah terdaftar di sistem.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Format email tidak valid.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}