```javascript
export default async function handler(req, res) {
  // GET test
  if (req.method === "GET") {
    return res.status(200).json({
      status: "GymGenie API radi.",
      message: "Koristi POST zahtjev za generisanje plana."
    });
  }

  // Samo POST generiše plan
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

ZA SVAKI DAN:
DAN - TRENING ili ODMOR
- 3 do 5 vježbi ako je trening
- serije x ponavljanja
- obroci prema broju obroka
- kalorije
- protein
- voda

Ne piši objašnjenja vježbi.
Ne piši uvod.
Ne ponavljaj podatke korisnika.
Budi kratak i praktičan.

Na kraju:
CILJ:
KALORIJE:
PROTEIN:
VODA:

Piši na srpskom/bosanskom jeziku.
Kalorije, protein i voda su okvirne preporuke.
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
              content: "You are GymGenie. Give short practical fitness plans."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: 1800,
          reasoning_effort: "low",
          temperature: 0.5
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

    const plan =
      data?.choices?.[0]?.message?.content ||
      data?.result?.response ||
      "";

    if (!plan) {
      console.error("No AI text:", data);

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
      error: "Greška servera: " + (error?.message || "Nepoznata greška.")
    });
  }
}
```
