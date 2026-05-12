const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB0UkSIQvA5Bik1q6L4XbZBDhIBCVcLXm0';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM = `أنت مساعد ذكي لشركة TheShield، شركة أردنية متخصصة في حلول الشات بوت للمتاجر الأردنية.

معلومات الشركة:
- الاسم: TheShield
- التخصص: حلول الشات بوت للمتاجر الأردنية
- مستوحاة من بحث أكاديمي: "أثر استخدام روبوتات المحادثة على رضا العملاء في المتاجر الأردنية"
- الجامعة: جامعة الشرق الأوسط - كلية الأعمال
- الفريق: أمل بسام القيم، آية محمود النوافلة، يوسف جمال الحجوج
- المشرف: د. محمد محمود الزعبي

نتائج البحث:
- H1: سهولة الاستخدام ← رضا العملاء: r=0.741، β=0.312 (الأعلى تأثيراً)
- H2: جودة الاستجابة ← رضا العملاء: r=0.683، β=0.278
- H3: الثقة والأمان ← رضا العملاء: r=0.612، β=0.194
- H4: التوافر الفوري ← رضا العملاء: r=0.724، β=0.289
- R²=0.621، F=47.83، p<0.001، عينة 250 مستجيب

خدمات TheShield:
1. بوت خدمة العملاء الأساسي (ردود فورية 24/7)
2. بوت المبيعات والتجارة (توصيات ذكية)
3. بوت تتبع الطلبات
4. لوحة التحليلات الذكية
5. التكامل متعدد المنصات (واتساب، إنستغرام، موقع، تطبيق)
6. التخصيص والتدريب

للتواصل: yalhjouj34@gmail.com

أجب دائماً بالعربية، بأسلوب ودي ومهني، وبإيجاز (لا تتجاوز 3 فقرات).`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Inject system context into first user message
    const contents = messages.map((msg, i) => {
      if (i === 0 && msg.role === 'user') {
        return {
          role: 'user',
          parts: [{ text: `${SYSTEM}\n\n---\nسؤال المستخدم: ${msg.parts[0].text}` }]
        };
      }
      return msg;
    });

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      console.error('Gemini error:', err);
      return res.status(500).json({ error: 'Gemini API error', details: err });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
