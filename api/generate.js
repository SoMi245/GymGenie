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

    if (!height || !weight || !age) {
      return res.status(400).json({
        error: "Nedostaju podaci."
      });
    }

    const prompt = `
Ti si GymGenie AI trener.

Podaci korisnika:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto: ${location}
Obroka dnevno: ${meals}

Napravi KRATAK plan za svih 7 dana.

Za svaki dan napiši:
- TRENING ili ODMOR
- ako je trening: 3-5 vježbi, serije x ponavljanja
- obroke prema broju obroka
- okvirne kalorije
- protein
- vodu

Bez objašnjenja vježbi i bez dugog uvoda.
Piši jasno i kratko na srpskom/bosanskom jeziku.

Na kraju napiši:
CILJ:
KALORIJE:
PROTEIN:
VODA:

Kalorije, protein i voda su okvirne preporuke.
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
              content: "You are GymGenie. Give concise fitness plans."
            },
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
      console.error("Cloudflare:", data);

      return res.status(502).json({
        error:
          data?.error?.message ||
          data?.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    const plan =
      data?.choices?.[0]?.message?.content ||
      data?.result?.response;

    if (!plan) {
      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    return res.status(200).json({
      plan: plan
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
