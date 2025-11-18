// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyAhLPd4UufJgd5GyzZVRFOu7IxwOQeDLPY",
  authDomain: "exyte-chat-demo.firebaseapp.com",
  projectId: "exyte-chat-demo",
  storageBucket: "exyte-chat-demo.firebasestorage.app",
  messagingSenderId: "973561993623",
  appId: "1:973561993623:web:f7fbddb6c2fc7ab3268cd2",
  measurementId: "G-27X5D45VDR"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let confirmationResult;

// === SEND OTP ===
async function sendOTP() {
  const phone = document.getElementById("phone").value;

  if (!phone.startsWith("+")) {
    alert("Phone number must start with +");
    return;
  }

  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    "recaptcha-container",
    { size: "normal" }
  );

  confirmationResult = await auth.signInWithPhoneNumber(
    phone,
    window.recaptchaVerifier
  );

  document.getElementById("otp-section").style.display = "block";
  alert("OTP sent!");
}

// === VERIFY OTP ===
async function verifyOTP() {
  const code = document.getElementById("otp").value;
  const username = document.getElementById("username").value;

  const result = await confirmationResult.confirm(code);
  const user = result.user;

  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();

  const now = new Date().toISOString();

  if (!snap.exists) {
    await userRef.set({
      id: user.uid,
      avatarURL: null,
      deviceId: crypto.randomUUID(),
      userName: username,
      phoneNumber: user.phoneNumber,
      verified: true,     // because OTP verified successfully
      createdAt: now,
      updatedAt: now
    });
  } else {
    await userRef.update({
      verified: true,
      updatedAt: now
    });
  }

  alert("Phone verified & user saved!");
}

// === START DINNER TOPIC ===
async function startTopic() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("You must sign in first!");
    return;
  }

  const db = firebase.firestore();
  const topic = "dinner";

  await db.collection("users")
    .doc(user.uid)
    .collection("topics")
    .doc(topic)
    .collection("messages")
    .add({
      type: "topic_start",
      topic: topic,
      ts: new Date().toISOString()
    });

  alert("Dinner topic started!");
}

