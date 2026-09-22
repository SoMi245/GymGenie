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
Napravi personalizovani sedmodnevni fitness plan.

PODACI:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

PRAVILA:
- Mora biti TAČNO 7 dana: PONEDJELJAK, UTORAK, SRIJEDA, ČETVRTAK, PETAK, SUBOTA, NEDELJA.
- Svaki dan mora biti označen kao TRENING ili ODMOR.
- Ako je TRENING: navedi najviše 4 vježbe.
- Za svaku vježbu navedi serije x ponavljanja.
- Ako je ODMOR: napiši samo ODMOR i obroke.
- Za svaki dan navedi obroke prema broju obroka korisnika.
- Za svaki dan navedi okvirne kalorije, protein i vodu.
- Na kraju navedi CILJ, KALORIJE, PROTEIN i VODU.
- Bez uvoda.
- Bez objašnjavanja vježbi.
- Bez napomena.
- Bez ponavljanja.
- Ne ponavljaj instrukcije.
- Nakon NEDELJE odmah završi odgovor.
- Piši kratko, jasno i na srpskom/bosanskom jeziku.

FORMAT:

PONEDJELJAK — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

UTORKA — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

SRIJEDA — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

ČETVRTAK — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

PETAK — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

SUBOTA — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

NEDELJA — TRENING/ODMOR
Vježbe:
- vježba — serije x ponavljanja

Obroci:
- obrok
- obrok

Kalorije: ___ kcal
Protein: ___ g
Voda: ___ L

CILJ: ___
KALORIJE: ___ kcal
PROTEIN: ___ g
VODA: ___ L
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
                "You are GymGenie. Return only the requested 7-day fitness plan. Do not repeat instructions. Do not add text after Sunday."
            },
            {
              role: "user",
              content: prompt
            }
          ],

          chat_template_kwargs: {
            enable_thinking: false
          },

          max_completion_tokens: 1600,
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
