/**
 * Firebase Functions v2 + OpenAI integration
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");

initializeApp();

const { OpenAI } = require("openai");

// Declare secret OPENAI_API_KEY
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Firestore Trigger: user starts topic
exports.onTopicStart = onDocumentCreated(
  {
    document: "users/{uid}/topics/{topic}/messages/{msgId}",
    secrets: [OPENAI_API_KEY], // required so secret is injected
  },
  async (event) => {
    const data = event.data.data();
    const { uid, topic } = event.params;

    // Only process topic_start messages
    if (data.type !== "topic_start") return;

    logger.info(`🔥 Topic start detected for user: ${uid}, topic: ${topic}`);

    // Initialize OpenAI client WITHIN the function
    const client = new OpenAI({
      apiKey: OPENAI_API_KEY.value(),
    });

    // (Optional) Call OpenAI here if you want
    // const completion = await client.chat.completions.create({ ... });

    // Send first bot message
    const initialBotMsg =
      `Hi! For ${topic}, tell me your top 3 favorite restaurants.`;

    await event.data.ref.parent.add({
      sender: "topic_bot",
      message: initialBotMsg,
      ts: new Date().toISOString(),
    });

    return;
  }
);
