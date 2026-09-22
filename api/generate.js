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

Podaci korisnika:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

Napravi KRATAK personalizovani plan za svih 7 dana.

ZA SVAKI DAN:
DAN - TRENING ili ODMOR
- 3 do 5 vježbi ako je trening
- serije x ponavljanja
- obroci prema broju obroka
- okvirne kalorije
- protein
- voda

Bez uvoda.
Bez objašnjenja vježbi.
Budi kratak i praktičan.
Piši na srpskom/bosanskom jeziku.

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
              role: "system",
              content: "You are GymGenie. Give short practical fitness plans."
            },
            {
              role: "user",
              content: prompt
            }
          ],

          // BITNO: gasi GLM thinking da ne potroši sav output na reasoning
          chat_template_kwargs: {
            enable_thinking: false
          },

          max_completion_tokens: 1800,
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

    const content = data?.choices?.[0]?.message?.content;

    let plan = "";

    if (typeof content === "string") {
      plan = content;
    } else if (Array.isArray(content)) {
      plan = content
        .filter(item => item?.type === "text" || typeof item === "string")
        .map(item => typeof item === "string" ? item : item.text || "")
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
