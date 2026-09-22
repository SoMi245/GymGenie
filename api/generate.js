export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
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

    if (!height || !weight || !age) {
      return res.status(400).json({
        error: "Nedostaju visina, težina ili godine."
      });
    }

    const prompt = `
Ti si GymGenie, AI fitness i nutrition trener.

Napravi personalizovan plan za korisnika:

Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

NAPRAVI PLAN ZA SVIH 7 DANA.

Za svaki dan napiši:
- da li je TRENING ili ODMOR
- ako je trening: konkretne vježbe, serije, ponavljanja i odmor
- obroke za taj dan
- približne kalorije
- približne proteine
- preporuku vode

Koristi samo opremu dostupnu na navedenom mjestu treninga.

Broj trening dana mora odgovarati izboru korisnika.

Na kraju napiši:
UKUPNI CILJ
DNEVNE KALORIJE
DNEVNI PROTEIN
DNEVNA VODA

Piši jasno i pregledno na srpskom/bosanskom jeziku.
Kalorije, protein i voda su okvirne preporuke, a ne medicinski savjet.
`;

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "@cf/zai-org/glm-4.7-flash",
          messages: [
            {
              role: "system",
              content: "You are GymGenie, a helpful AI fitness and nutrition planner."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: 3500,
          reasoning_effort: "low",
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudflare API error:", data);

      return res.status(response.status || 500).json({
        error:
          data?.error?.message ||
          data?.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    const plan =
      data?.choices?.[0]?.message?.content ||
      data?.result?.response ||
      "";

    if (!plan) {
      console.error("Cloudflare returned no text:", data);

      return res.status(502).json({
        error: "AI nije vratio tekst plana."
      });
    }

    return res.status(200).json({
      plan
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
