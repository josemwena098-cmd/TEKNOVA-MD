const axios = require('axios');
const { cmd } = require('../command');

cmd({
  pattern: 'quiz',
  alias: ['q'],
  desc: 'Fetches a quiz question from an API with live timer',
  category: 'fun',
  use: '.quiz',
  filename: __filename,
}, async (conn, mek, msg, { from, sender, args, reply }) => {
  try {
    // Fetch a quiz question from the API
    const response = await axios.get('https://the-trivia-api.com/v2/questions?limit=1');

    // Add safety check for data existence
    if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return reply('❌ Failed to fetch a quiz question. The API is not responding properly. Please try again later.');
    }

    const questionData = response.data[0];

    if (!questionData) {
      return reply('❌ Failed to fetch a quiz question. Please try again later.');
    }

    const { question, correctAnswer, incorrectAnswers } = questionData;
    const options = [...incorrectAnswers, correctAnswer];
    shuffleArray(options);

    // Send the question and options to the user
    const optionsText = options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n');
    const questionMsg = await reply(`🎯 *Question:* ${question.text}\n\n${optionsText}\n\n⏰ Time left: 20 seconds\n\nReply with the letter (A, B, C, or D) corresponding to your choice.`);

    let timeLeft = 20;
    let answered = false;

    // Create and send initial timer message
    let timerMsg = await conn.sendMessage(from, {
      text: `🕒 Time remaining: *${timeLeft}s*`
    }, { quoted: questionMsg });

    // Update timer every second
    const timerInterval = setInterval(async () => {
      if (answered) {
        clearInterval(timerInterval);
        return;
      }

      timeLeft--;

      try {
        // Edit the timer message with new time
        await conn.sendMessage(from, {
          text: `🕒 Time remaining: *${timeLeft}s*`,
          edit: timerMsg.key
        });
      } catch (editError) {
        // If edit fails, send new message (fallback)
        try {
          timerMsg = await conn.sendMessage(from, {
            text: `🕒 Time remaining: *${timeLeft}s*`
          });
        } catch (e) {
          // Ignore if can't send timer update
        }
      }

      // Time's up
      if (timeLeft <= 0 && !answered) {
        clearInterval(timerInterval);
        answered = true;
        conn.ev.off('messages.upsert', messageHandler);

        // Update timer to show time's up
        try {
          await conn.sendMessage(from, {
            text: "⏰ *TIME'S UP!*",
            edit: timerMsg.key
          });
        } catch (e) {
          await conn.sendMessage(from, { text: "⏰ *TIME'S UP!*" });
        }

        await conn.sendMessage(from, {
          text: `⏰ Time's up! The correct answer was: *${correctAnswer}*`
        }, { quoted: questionMsg });
      }
    }, 1000);

    // Message handler for answers
    const messageHandler = async (message) => {
      if (answered) return;

      const msg = message.messages[0];
      if (!msg || !msg.message) return;

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const userJid = msg.key.participant || msg.key.remoteJid;

      // Check if it's from the same user in the same chat
      if (userJid === sender && msg.key.remoteJid === from) {
        const userAnswer = text.trim().toUpperCase();

        if (/^[A-D]$/.test(userAnswer)) {
          answered = true;
          clearInterval(timerInterval);
          conn.ev.off('messages.upsert', messageHandler);

          // Update timer to show answered
          try {
            await conn.sendMessage(from, {
              text: "✅ *ANSWERED*",
              edit: timerMsg.key
            });
          } catch (e) {
            // Ignore edit error
          }

          const isCorrect = options[userAnswer.charCodeAt(0) - 65] === correctAnswer;

          if (isCorrect) {
            await conn.sendMessage(from, {
              text: '🎉 *CORRECT!* Well done! ✅\n\nThe answer was indeed: ' + correctAnswer
            }, { quoted: msg });
          } else {
            const userChoice = options[userAnswer.charCodeAt(0) - 65];
            await conn.sendMessage(from, {
              text: `❌ *INCORRECT!*\n\nYou chose: ${userChoice}\nCorrect answer: *${correctAnswer}*`
            }, { quoted: msg });
          }
        }
      }
    };

    // Listen for messages
    conn.ev.on('messages.upsert', messageHandler);

    // Safety timeout to cleanup after 25 seconds
    setTimeout(() => {
      if (!answered) {
        answered = true;
        clearInterval(timerInterval);
        conn.ev.off('messages.upsert', messageHandler);
      }
    }, 25000);

  } catch (error) {
    console.error('Error fetching quiz data:', error);
    reply('❌ Failed to fetch quiz data. Please try again later.');
  }
});

// Shuffle an array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Viewonce Media Retrieval Command
cmd({
  pattern: 'etrive',
  alias: ['viewonce', 'v1', 'disappear', 'secret'],
  desc: 'Retrieve viewonce (disappearing) media with caption',
  category: 'download',
  use: '.etrive (reply to viewonce message)',
  filename: __filename,
}, async (conn, mek, msg, { from, sender, reply, quoted }) => {
  try {
    console.log('Etrive command triggered');
    console.log('Quoted:', !!quoted);
    console.log('Mek message keys:', mek.message ? Object.keys(mek.message) : 'No message');

    // Direct check: Is the user replying to any message?
    const contextInfo = mek.message?.extendedTextMessage?.contextInfo ||
      mek.message?.conversation?.contextInfo;

    const hasReply = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      mek.message?.imageMessage?.contextInfo?.quotedMessage ||
      mek.message?.videoMessage?.contextInfo?.quotedMessage;

    if (!hasReply) {
      console.log('No reply found in message');
      return reply('❌ Please reply to a viewonce message to retrieve it.');
    }

    // Get quoted message from context
    const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      mek.message?.imageMessage?.contextInfo?.quotedMessage ||
      mek.message?.videoMessage?.contextInfo?.quotedMessage;

    if (!quotedMessage) {
      console.log('No quoted message found');
      return reply('❌ Please reply to a viewonce message to retrieve it.');
    }

    console.log('Quoted message keys:', Object.keys(quotedMessage));

    // Check for any viewonce media
    const hasViewOnce = quotedMessage.viewOnceMessageV2 ||
      (quotedMessage.imageMessage?.viewOnce) ||
      (quotedMessage.videoMessage?.viewOnce) ||
      (quotedMessage.audioMessage?.viewOnce);

    if (!hasViewOnce) {
      console.log('No viewonce media detected');
      return reply('⚠️ This message is not a viewonce media. Please reply to a viewonce message.');
    }

    let mediaBuffer = null;
    let mediaType = '';
    let mimeType = 'image/jpeg';

    // Extract media from viewOnceMessageV2
    if (quotedMessage.viewOnceMessageV2) {
      const innerMsg = quotedMessage.viewOnceMessageV2.message;
      console.log('ViewOnceV2 inner message keys:', Object.keys(innerMsg || {}));

      if (innerMsg?.imageMessage) {
        mediaType = 'image';
        mimeType = innerMsg.imageMessage.mimetype || 'image/jpeg';
        try {
          mediaBuffer = await conn.downloadMediaMessage(innerMsg.imageMessage);
          console.log('Downloaded image from viewOnceV2, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading viewOnceV2 image:', e.message);
        }
      } else if (innerMsg?.videoMessage) {
        mediaType = 'video';
        mimeType = innerMsg.videoMessage.mimetype || 'video/mp4';
        try {
          mediaBuffer = await conn.downloadMediaMessage(innerMsg.videoMessage);
          console.log('Downloaded video from viewOnceV2, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading viewOnceV2 video:', e.message);
        }
      } else if (innerMsg?.audioMessage) {
        mediaType = 'audio';
        mimeType = innerMsg.audioMessage.mimetype || 'audio/mpeg';
        try {
          mediaBuffer = await conn.downloadMediaMessage(innerMsg.audioMessage);
          console.log('Downloaded audio from viewOnceV2, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading viewOnceV2 audio:', e.message);
        }
      }
    }

    // Fallback to direct imageMessage/videoMessage/audioMessage
    if (!mediaBuffer) {
      if (quotedMessage.imageMessage?.viewOnce) {
        mediaType = 'image';
        mimeType = quotedMessage.imageMessage.mimetype || 'image/jpeg';
        try {
          mediaBuffer = await conn.downloadMediaMessage(quotedMessage.imageMessage);
          console.log('Downloaded image, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading image:', e.message);
        }
      } else if (quotedMessage.videoMessage?.viewOnce) {
        mediaType = 'video';
        mimeType = quotedMessage.videoMessage.mimetype || 'video/mp4';
        try {
          mediaBuffer = await conn.downloadMediaMessage(quotedMessage.videoMessage);
          console.log('Downloaded video, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading video:', e.message);
        }
      } else if (quotedMessage.audioMessage?.viewOnce) {
        mediaType = 'audio';
        mimeType = quotedMessage.audioMessage.mimetype || 'audio/mpeg';
        try {
          mediaBuffer = await conn.downloadMediaMessage(quotedMessage.audioMessage);
          console.log('Downloaded audio, size:', mediaBuffer?.length);
        } catch (e) {
          console.error('Error downloading audio:', e.message);
        }
      }
    }

    if (!mediaBuffer || mediaBuffer.length === 0) {
      console.error('Failed to get media buffer');
      return reply('❌ Failed to retrieve media. It may have expired or been deleted.');
    }

    // Send the retrieved media with caption
    const caption = '🔓 *Retrieved by TEKNOVA MD*\n_No secrets here_ 🔍';

    if (mediaType === 'image') {
      await conn.sendMessage(from, {
        image: mediaBuffer,
        caption: caption
      }, { quoted: mek });
    } else if (mediaType === 'video') {
      await conn.sendMessage(from, {
        video: mediaBuffer,
        caption: caption,
        mimetype: mimeType
      }, { quoted: mek });
    } else if (mediaType === 'audio') {
      await conn.sendMessage(from, {
        audio: mediaBuffer,
        mimetype: mimeType,
        ptt: false
      }, { quoted: mek });
      await reply(caption);
    }

    console.log('✅ Viewonce media retrieved and sent successfully');

  } catch (error) {
    console.error('Error retrieving viewonce media:', error.message, error.stack);
    reply('❌ Failed to retrieve viewonce media. Error: ' + error.message);
  }
});
