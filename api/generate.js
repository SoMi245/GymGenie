export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Koristi POST." });
  }

  try {
    const { height, weight, age, experience, goal, trainingDays, location, meals } = req.body || {};

    const prompt = `
Napravi kratak personalizovani fitness plan za 7 dana.

Korisnik:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto: ${location}
Obroka dnevno: ${meals}

Za svaki od 7 dana napiši:
DAN:
TRENING ili ODMOR
Vježbe sa serijama i ponavljanjima ako je trening
Obroke
Kalorije
Protein
Vodu

Budi kratak. Bez uvoda i bez objašnjenja vježbi.
Piši na srpskom/bosanskom.
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
            { role: "user", content: prompt }
          ],
          max_tokens: 1200
        })
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        error: "Cloudflare greška",
        details: text
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Cloudflare nije vratio JSON.",
        details: text
      });
    }

    let plan = "";

    // Cloudflare OpenAI format
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];

      if (choice.message && typeof choice.message.content === "string") {
        plan = choice.message.content;
      }

      if (!plan && typeof choice.text === "string") {
        plan = choice.text;
      }
    }

    // Cloudflare Workers AI format
    if (!plan && data.result) {
      if (typeof data.result.response === "string") {
        plan = data.result.response;
      }

      if (typeof data.result.content === "string") {
        plan = data.result.content;
      }
    }

    if (!plan) {
      return res.status(502).json({
        error: "AI nije vratio plan.",
        details: JSON.stringify(data)
      });
    }

    return res.status(200).json({ plan });

  } catch (error) {
    return res.status(500).json({
      error: "Greška servera.",
      details: error.message
    });
  }
}
