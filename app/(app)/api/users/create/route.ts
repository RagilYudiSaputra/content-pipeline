import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {

  console.log("PROJECT:", process.env.FIREBASE_PROJECT_ID);
  console.log("CLIENT:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log(
    "KEY PREFIX:",
    process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50)
  );

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