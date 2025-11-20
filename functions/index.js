// [START import]
'use strict';

const functions = require('firebase-functions/v1');
const {defineSecret} = require('firebase-functions/params');
const openai = require("openai");
// firebase-admin SDK init
const admin = require('firebase-admin');
admin.initializeApp();

const path = require('path');

// Init GCP secret manager to access OpenAI API key
const openaiApiKey = defineSecret('OPENAI_API_KEY');


// FUNCTIONS
exports.onTopicStart = functions.firestore
  .document("users/{uid}/topics/{topic}/messages/{msgId}")
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    if (!data || data.type !== "topic_start") return null;

    const { topic } = ctx.params;

    await snap.ref.parent.add({
      sender: "topic_bot",
      message: `Hi! For ${topic}, tell me your top 3 favorite restaurants.`,
      ts: new Date().toISOString()
    });

    return null;
  });

exports.onTopicMessage = functions.firestore
  .document("users/{uid}/topics/{topic}/messages/{msgId}")
  .onCreate(async (snap, ctx) => {
    const data = snap.data();
    if (!data || data.sender === "topic_bot" || data.type === "topic_start") return null;

    const client = new OpenAI({
      apiKey: openaiApiKey.value()
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are topic bot..." },
        { role: "user", content: data.message }
      ]
    });

    const reply = completion.choices[0].message.content;

    await snap.ref.parent.add({
      sender: "topic_bot",
      message: reply,
      ts: new Date().toISOString()
    });

    return null;
  });
