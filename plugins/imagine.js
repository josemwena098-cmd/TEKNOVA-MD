const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

cmd({
  pattern: "fluxai",
  alias: ["flux"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "ai",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a prompt for the image.\n\nExample: .fluxai a beautiful sunset");

    await reply("> *⏳ CREATING IMAGE ...🔥*");

    const apiUrl = `https://api.popcat.xyz/imagine?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 60000 });

    if (!response || !response.data || response.data.length === 0) {
      return reply("❌ Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✨ *Generated Image* ✨\n\n💬 Prompt: ${q}\n🤖 Powered by TEKNOVA MD`
    }, { quoted: mek });

  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`❌ Error: ${error.message || "Image generation failed. Try again later."}`);
  }
});

cmd({
  pattern: "stablediffusion",
  alias: ["sdiffusion"],
  react: "🚀",
  desc: "Generate an image using Stable Diffusion.",
  category: "ai",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a prompt for the image.\n\nExample: .stablediffusion a magical forest");

    await reply("> *⏳ CREATING IMAGE ...🔥*");

    const apiUrl = `https://api.popcat.xyz/v2/imagine?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 60000 });

    if (!response || !response.data || response.data.length === 0) {
      return reply("❌ Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✨ *Generated Image* ✨\n\n💬 Prompt: ${q}\n🤖 Powered by TEKNOVA MD`
    }, { quoted: mek });

  } catch (error) {
    console.error("StableDiffusion Error:", error);
    reply(`❌ Error: ${error.message || "Image generation failed. Try again later."}`);
  }
});

cmd({
  pattern: "stabilityai",
  alias: ["stability"],
  react: "🚀",
  desc: "Generate an image using Stability AI.",
  category: "ai",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("❌ Please provide a prompt for the image.\n\nExample: .stabilityai cyberpunk city");

    await reply("> *⏳ CREATING IMAGE ...🔥*");

    const apiUrl = `https://api.popcat.xyz/v2/generation?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 60000 });

    if (!response || !response.data || response.data.length === 0) {
      return reply("❌ Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await conn.sendMessage(from, {
      image: imageBuffer,
      caption: `✨ *Generated Image* ✨\n\n💬 Prompt: ${q}\n🤖 Powered by TEKNOVA MD`
    }, { quoted: mek });

  } catch (error) {
    console.error("StabilityAI Error:", error);
    reply(`❌ Error: ${error.message || "Image generation failed. Try again later."}`);
  }
});
