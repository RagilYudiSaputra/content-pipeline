"use client";
import { auth } from "../../lib/firebase";

export default function TestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border p-8 shadow">
        <h1 className="text-2xl font-bold">
          Firebase Connected ✅
        </h1>

        <p className="mt-3">
          Current User :
          {auth.currentUser?.email ?? "Belum Login"}
        </p>
      </div>
    </div>
  );
}