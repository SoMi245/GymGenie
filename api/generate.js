export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Koristi POST." });
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
Napravi KRATAK personalizovani fitness plan za svih 7 dana.

Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto: ${location}
Obroka dnevno: ${meals}

Za svaki dan napiši:
DAN
TRENING ili ODMOR
3-5 vježbi sa serijama i ponavljanjima ako je trening
obroke
kalorije
protein
vodu

Bez uvoda i bez objašnjenja vježbi.
Piši kratko na srpskom/bosanskom.
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
          max_completion_tokens: 1200,
          temperature: 0.5
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Cloudflare greška.",
        details: data
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    let plan = "";

    if (typeof content === "string") {
      plan = content;
    } else if (Array.isArray(content)) {
      plan = content
        .map(item => {
          if (typeof item === "string") return item;
          if (item?.text) return item.text;
          return "";
        })
        .join("");
    } else if (content && typeof content === "object") {
      plan = content.text || content.content || "";
    }

    if (!plan) {
      return res.status(502).json({
        error: "AI nije vratio plan.",
        cloudflare: {
          id: data?.id,
          model: data?.model,
          object: data?.object,
          choices: data?.choices
        }
      });
    }

    return res.status(200).json({
      plan
    });

  } catch (error) {
    return res.status(500).json({
      error: "Greška servera.",
      details: error.message
    });
  }
}
