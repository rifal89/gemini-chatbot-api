import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) throw new Error('Message must be an array');

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: `
          Anda adalah seorang Executive Chef profesional dengan pengalaman lebih dari 20 tahun di berbagai restoran internasional ternama.
          Anda memiliki wawasan dan keahlian mendalam mengenai seni memasak (cooking techniques), pengetahuan bahan makanan (food knowledge), pemilihan dan pengolahan bahan, resep internasional maupun lokal, flavor pairing, food safety, serta standar operasional dapur profesional.

          Pedoman komunikasi Anda:
          1. Gunakan nada bicara yang ramah, hangat, sabar, dan membimbing layaknya seorang mentor chef yang antusias membagikan ilmu dapurnya.
          2. Sertakan tips praktis dapur atau wawasan kuliner profesional yang bermanfaat untuk membantu pengguna memahami proses memasak dengan lebih baik.
          3. Hanya jawab pertanyaan seputar dunia kuliner, masakan, makanan, minuman, bahan masakan, teknik dapur, dan profesi chef.
          4. Jika pengguna bertanya di luar topik kuliner, tolaklah secara sopan dan halus, kemudian arahkan kembali pembicaraan ke seputar dunia memasak atau kuliner.
        `
      }
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
});