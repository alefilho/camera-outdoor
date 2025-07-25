require('dotenv').config();

const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');

const rtspUrl = process.env.RTSP_URL;
const snapshotFile = process.env.SNAPSHOT_FILE;
const wahaApiUrl = process.env.WAHA_API_URL;
const wahaApiKey = process.env.WAHA_API_KEY;
const wahaSession = process.env.WAHA_SESSION;
const wahaChatId = process.env.WAHA_CHAT_ID;

if (fs.existsSync(snapshotFile)) {
  fs.unlinkSync(snapshotFile);
  console.log(`Arquivo ${snapshotFile} deletado!`);
}

const ffmpegCmd = `ffmpeg -rtsp_transport tcp -i "${rtspUrl}" -frames:v 1 -q:v 2 ${snapshotFile}`;

exec(ffmpegCmd, (error) => {
  if (error) {
    console.error(`Erro ao capturar snapshot: ${error.message}`);
    return;
  }

  console.log('Snapshot salvo!');

  const imageBuffer = fs.readFileSync(snapshotFile);
  const imageBase64 = imageBuffer.toString('base64');

  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const payload = {
    session: wahaSession,
    chatId: wahaChatId,
    file: {
      mimetype: 'image/jpeg',
      filename: snapshotFile,
      data: imageBase64
    },
    caption: formattedDate
  };

  axios.post(wahaApiUrl, payload, {
    headers: {
      'x-api-key': wahaApiKey
    }
  })
  .then((response) => {
    console.log('Imagem enviada com sucesso');
  })
  .catch((err) => {
    console.error('Erro ao enviar imagem:', err.response?.data || err.message);
  })
  .finally((end) => {
    if (fs.existsSync(snapshotFile)) {
      fs.unlinkSync(snapshotFile);
      console.log(`Arquivo ${snapshotFile} deletado!`);
    }
  });
});
