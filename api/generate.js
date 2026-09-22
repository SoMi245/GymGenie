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

    const prompt = `
Ti si GymGenie AI trener.

PODACI KORISNIKA:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

NAPRAVI PERSONALIZOVAN PLAN ZA TAČNO 7 DANA.

VAŽNA PRAVILA ZA TRENING:

- Tačno ${trainingDays} dana moraju biti TRENING.
- Ostali dani su ODMOR ili AKTIVNI ODMOR.
- Rasporedi treninge kroz sedmicu tako da postoji dovoljan odmor.
- Prilagodi vježbe cilju i nivou korisnika.
- Nikada nemoj izmišljati nazive vježbi.
- Koristi samo stvarne i poznate nazive vježbi.
- Ne prevodi nazive vježbi bukvalno ako bi prevod bio nejasan. Koristi uobičajeni naziv, npr. sklekovi, čučanj, iskorak, plank, zgibovi, veslanje, bench press.
- Ne ponavljaj isti kompletan trening.
- Ako je TERETANA, koristi sprave, šipku, bučice i sajle.
- Ako je KUĆA - BEZ OPREME, koristi samo vježbe sa sopstvenom težinom.
- Ako je KUĆA - OSNOVNA OPREMA, koristi samo osnovnu opremu.
- Na svakom treningu navedi 4-5 vježbi.
- Za svaku vježbu navedi serije i ponavljanja.

ISHRANA:

- Navedi tačno ${meals} obroka svakog dana.
- Obroci neka budu različiti i realni.
- Koristi normalne namirnice.
- Prilagodi okvirnu ishranu cilju korisnika.
- Kalorije, protein i voda su OKVIRNE vrijednosti, nisu medicinski savjet.
- Ne preporučuj ekstremne dijete ili ekstremno smanjenje hrane.

FORMAT ODGOVORA:

PONEDJELJAK — TRENING ili ODMOR

Vježbe:
- Naziv vježbe — 3 x 10
- Naziv vježbe — 3 x 12
- Naziv vježbe — 3 x 10
- Naziv vježbe — 3 x 15

Obroci:
- Doručak: ...
- Obrok 2: ...
- Ručak: ...
- Večera: ...

Kalorije: ... kcal
Protein: ... g
Voda: ... L

UTORKA — TRENING ili ODMOR

[isti format]

SRIJEDA — TRENING ili ODMOR

[isti format]

ČETVRTAK — TRENING ili ODMOR

[isti format]

PETAK — TRENING ili ODMOR

[isti format]

SUBOTA — TRENING ili ODMOR

[isti format]

NEDELJA — TRENING ili ODMOR

[isti format]

CILJ: ${goal}
KALORIJE: ... kcal
PROTEIN: ... g
VODA: ... L

STROGO:
- Samo plan.
- Bez uvoda.
- Bez objašnjenja.
- Bez ponavljanja instrukcija.
- Bez izmišljanja vježbi.
- Bez teksta nakon VODA.
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
                "You are GymGenie. Create accurate, concise and personalized fitness plans. Use only real exercise names. Never invent exercise names."
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
      console.error("Cloudflare response:", JSON.stringify(data));

      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    return res.status(200).json({
      plan
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera: " + (error?.message || "Nepoznata greška.")
    });
  }
}
