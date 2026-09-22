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
    } = req.body;

    if (!height || !weight || !age) {
      return res.status(400).json({
        error: "Nedostaju visina, težina ili godine."
      });
    }

    const prompt = `
Ti si GymGenie, personalni AI fitness i nutrition trener.

Napravi potpuno personalizovan plan za korisnika.

PODACI KORISNIKA:
Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

NAPRAVI PLAN ZA SVIH 7 DANA.

Za SVAKI dan obavezno napiši:

DAN 1 - PONEDJELJAK
- da li je trening ili odmor
- konkretne vježbe
- serije
- ponavljanja
- odmor između serija
- obroke za taj dan
- približne kalorije
- približne proteine
- unos vode

Isto uradi za:
DAN 2 - UTORAK
DAN 3 - SRIJEDA
DAN 4 - ČETVRTAK
DAN 5 - PETAK
DAN 6 - SUBOTA
DAN 7 - NEDJELJA

Plan mora biti stvarno prilagođen podacima korisnika.

Ako je korisnik početnik, koristi jednostavnije i sigurnije vježbe.
Ako trenira kod kuće, koristi samo opremu koju ima.
Ako trenira u teretani, koristi vježbe i sprave dostupne u teretani.
Obavezno ubaci dane oporavka prema broju treninga sedmično.

Piši jasno, pregledno i praktično na srpskom/bosanskom jeziku.

Na kraju dodaj:
- UKUPNI CILJ
- PREPORUČENI DNEVNI KALORIJSKI RASPON
- PREPORUČENI PROTEIN
- PREPORUKU ZA VODU

Napomena: kalorije, proteini i voda su okvirne preporuke, a ne medicinski savjet.
`;

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/run/@cf/zai-org/glm-4.7-flash",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are GymGenie, a helpful AI fitness and nutrition planner."
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

    if (!response.ok || !data.success) {
      return res.status(response.status || 500).json({
        error:
          data.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    return res.status(200).json({
      plan: data.result?.response || "AI nije vratio plan."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
