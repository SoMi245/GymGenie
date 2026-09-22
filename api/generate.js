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

Za svaki dan napiši:
DAN - TRENING ili ODMOR
Ako je trening: 3 do 5 vježbi, serije i ponavljanja.
Napiši i obroke, kalorije, protein i vodu.

Bez dugog uvoda.
Bez objašnjenja vježbi.
Piši na srpskom/bosanskom jeziku.
`;

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/run/@cf/zai-org/glm-4.7-flash",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are GymGenie AI trainer."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudflare error:", data);

      return res.status(502).json({
        error:
          data?.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    const plan = data?.result?.response;

    if (!plan) {
      console.error("Cloudflare response:", JSON.stringify(data));

      return res.status(502).json({
        error: "AI nije vratio plan.",
        debug: data
      });
    }

    return res.status(200).json({
      plan: plan
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera: " + error.message
    });
  }
}
