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
- TRENING ili ODMOR
- 3 do 5 vježbi ako je trening
- serije x ponavljanja
- obroke
- kalorije
- protein
- vodu

Bez dugog uvoda.
Bez objašnjenja vježbi.
Piši kratko na srpskom/bosanskom jeziku.
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

    // PRIVREMENI TEST:
    // Prikazuje kompletan odgovor Cloudflare-a
    // da vidimo gdje se nalazi AI tekst.
    return res.status(200).json({
      cloudflare_response: data
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: "Greška servera: " + (error?.message || "Nepoznata greška.")
    });
  }
}
