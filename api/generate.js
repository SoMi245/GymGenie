export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Koristi POST zahtjev." });
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

Korisnik:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

Napravi KRATAK plan za svih 7 dana.

Za svaki dan:
- TRENING ili ODMOR
- 3-5 vježbi ako je trening
- serije x ponavljanja
- obroci
- kalorije
- protein
- voda

Bez dugog uvoda.
Bez objašnjenja vježbi.
Piši kratko na srpskom/bosanskom jeziku.

Na kraju:
CILJ:
KALORIJE:
PROTEIN:
VODA:
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
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: 1800,
          temperature: 0.5
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Cloudflare AI greška."
      });
    }

    // Pokušaj pronaći tekst iz različitih mogućih formata
    let plan = "";

    if (data?.choices?.[0]?.message?.content) {
      plan = data.choices[0].message.content;
    } else if (data?.choices?.[0]?.text) {
      plan = data.choices[0].text;
    } else if (data?.result?.response) {
      plan = data.result.response;
    } else if (data?.result?.content) {
      plan = data.result.content;
    } else if (typeof data?.response === "string") {
      plan = data.response;
    }

    if (!plan) {
      console.log("Cloudflare keys:", Object.keys(data || {}));

      return res.status(502).json({
        error: "AI nije vratio tekst."
      });
    }

    return res.status(200).json({
      plan: plan
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
