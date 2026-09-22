```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

Podaci:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto: ${location}
Obroka dnevno: ${meals}

Napravi KRATAK i JASAN plan za svih 7 dana.

Za svaki dan napiši samo:
DAN + TRENING/ODMOR
- 3 do 5 glavnih vježbi ako je trening
- serije x ponavljanja
- kratke obroke prema broju obroka
- okvirne kalorije
- protein
- voda

Ne objašnjavaj vježbe.
Ne piši uvod.
Ne ponavljaj podatke korisnika.
Ne dodaj nepotreban tekst.

Na kraju napiši:
CILJ:
KALORIJE:
PROTEIN:
VODA:

Koristi srpski/bosanski jezik.
Kalorije, protein i voda su okvirne preporuke, ne medicinski savjet.
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
              content: "You are GymGenie. Give short, practical fitness plans."
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

    return res.status(200).json({ plan });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
```
