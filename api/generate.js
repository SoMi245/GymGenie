export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Koristi POST zahtjev."
    });
  }

  try {
    const {
      height,
      weight,
      age,
      experience,
      goal,
      trainingDays,
      location,
      meals
    } = req.body || {};

    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);
    const d = Number(trainingDays);
    const m = Number(meals);

    if (!h || !w || !a || !d || !m) {
      return res.status(400).json({
        error: "Nedostaju podaci korisnika."
      });
    }

    // Osnovne okvirne vrijednosti.
    // AI ih NE mijenja.
    const bmi = w / Math.pow(h / 100, 2);

    let calories = Math.round(w * 30);

    if (goal === "Dobijanje mišićne mase") {
      calories += 250;
    }

    if (goal === "Mršavljenje") {
      calories = Math.max(1800, calories - 250);
    }

    const protein = Math.round(w * 1.8);
    const water = Math.round(w * 0.035 * 10) / 10;

    const prompt = `
Ti si GymGenie, profesionalni AI fitness trener.

PODACI KORISNIKA:
Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

VEĆ IZRAČUNATE VRIJEDNOSTI:
Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

NIKADA NE MIJENJAJ OVE TRI VRIJEDNOSTI.

NAPRAVI PERSONALIZOVAN PLAN ZA TAČNO 7 DANA.

TRENING:
- Tačno ${d} dana treninga.
- Ostali dani ODMOR ili AKTIVNI ODMOR.
- Trening rasporedi logično kroz sedmicu.
- Prilagodi trening cilju: ${goal}.
- Prilagodi trening nivou: ${experience}.
- Prilagodi trening mjestu: ${location}.
- Ako je "Kuća - bez opreme", NE koristi zgibove, sprave, šipke, bučice ili bilo kakvu opremu.
- Ako je "Kuća - osnovna oprema", koristi samo osnovnu opremu.
- Ako je "Teretana", možeš koristiti sprave, šipku, bučice i sajle.
- Koristi samo stvarne i poznate vježbe.
- Nikada ne izmišljaj nazive vježbi.
- Svaki trening neka ima 4 do 5 vježbi.
- Ne ponavljaj isti kompletan trening.

ISHRANA:
- Svaki dan mora imati tačno ${m} obroka.
- Nemoj kopirati isti jelovnik više dana.
- Mijenjaj izvore proteina, ugljikohidrata, povrće i voće.
- Obroci moraju biti realni i jednostavni.
- Koristi iste ukupne vrijednosti svaki dan:
  ${calories} kcal
  ${protein} g proteina
  ${water} L vode

VAŽNO:
- Kalorije, protein i voda moraju biti IDENTIČNI svaki dan.
- Na kraju moraju biti IDENTIČNI ukupnim vrijednostima.
- Ne dodaj izmišljene vježbe.
- Ne dodaj uvod.
- Ne dodaj objašnjenja.
- Ne dodaj napomene.
- Ne ponavljaj instrukcije.
- Ne piši ništa nakon završetka plana.

FORMAT:

PONEDJELJAK — TRENING

Vježbe:
- Vježba — 3 x 10
- Vježba — 3 x 12
- Vježba — 3 x 10
- Vježba — 3 x 15

Obroci:
- Doručak: ...
- Obrok 2: ...
- Ručak: ...
- Večera: ...

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

[ISTI FORMAT ZA SVIH 7 DANA]

CILJ: ${goal}
KALORIJE: ${calories} kcal
PROTEIN: ${protein} g
VODA: ${water} L
`;

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "@cf/zai-org/glm-4.7-flash",

          messages: [
            {
              role: "system",
              content:
                "You are GymGenie. Generate concise, realistic and personalized fitness plans. Never invent exercises. Follow all numerical values exactly."
            },
            {
              role: "user",
              content: prompt
            }
          ],

          chat_template_kwargs: {
            enable_thinking: false
          },

          max_completion_tokens: 1800,
          temperature: 0.2
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudflare error:", data);

      return res.status(502).json({
        error:
          data?.error?.message ||
          data?.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    let plan = "";

    if (typeof content === "string") {
      plan = content;
    } else if (Array.isArray(content)) {
      plan = content
        .filter(
          item => item?.type === "text" || typeof item === "string"
        )
        .map(item =>
          typeof item === "string" ? item : item.text || ""
        )
        .join("");
    }

    if (!plan) {
      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    return res.status(200).json({
      plan,
      stats: {
        bmi: Number(bmi.toFixed(1)),
        calories,
        protein,
        water
      }
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera: " + (error?.message || "Nepoznata greška.")
    });
  }
}
