import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin"; // Pastikan path ini sesuai dengan file admin SDK Anda

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { message: "User ID dan Password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // 1. Update password di Firebase Authentication menggunakan Admin SDK
    await adminAuth.updateUser(userId, {
      password: newPassword,
    });

    // 2. (Opsional) Revoke refresh token agar sesi pengguna tersebut langsung log out dari device lain
    await adminAuth.revokeRefreshTokens(userId);

    return NextResponse.json(
      { message: "Password pengguna berhasil diperbarui di Firebase Auth." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Gagal update password user di Firebase Auth:", error);
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan pada server saat mengubah password." },
      { status: 500 }
    );
  }
}