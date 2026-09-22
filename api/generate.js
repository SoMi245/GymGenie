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
Ti si GymGenie AI personalni trener i nutricionista.

NAPRAVI PERSONALIZOVAN PLAN NA OSNOVU OVIH PODATAKA:

Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Broj treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Broj obroka dnevno: ${meals}

STROGA PRAVILA:

1. Napravi TAČNO 7 dana, od PONEDJELJKA do NEDELJE.

2. Broj dana sa treningom mora odgovarati korisnikovom izboru:
${trainingDays} dana treninga sedmično.

3. Ostatak dana moraju biti ODMOR ili AKTIVNI ODMOR.

4. Vježbe MORAŠ prilagoditi mjestu treninga:
- Teretana = sprave, šipke, bučice i kablovi.
- Kuća - bez opreme = samo vježbe sa sopstvenom težinom.
- Kuća - osnovna oprema = koristi bučice, elastične trake i osnovnu opremu.

5. Vježbe MORAŠ prilagoditi nivou:
${experience}

6. Vježbe MORAŠ prilagoditi cilju:
${goal}

7. Nemoj koristiti iste vježbe na svakom treningu.
Rasporedi različite mišićne grupe i napravi smislen sedmični raspored.

8. Za svaki trening navedi 4 do 6 vježbi.
Za svaku vježbu napiši:
- naziv
- serije x ponavljanja

9. Za svaki dan napravi TAČNO ${meals} obroka.
Obroci treba da budu različiti kroz sedmicu i praktični.

10. Na kraju svakog dana navedi:
Kalorije
Protein
Voda

11. Plan ishrane treba biti uravnotežen. Ne preporučuj ekstremno smanjenje hrane niti ekstremno povećanje kalorija.

12. Nemoj izmišljati opremu koju korisnik nema.

13. Ne ponavljaj isti kompletan trening više puta.

14. Ne piši uvod, objašnjenja ili napomene.

15. Nakon NEDELJE odmah završi odgovor.

KORISTI OVAJ FORMAT:

PONEDJELJAK — TRENING

Vježbe:
- Naziv — 3 x 10
- Naziv — 3 x 12
- Naziv — 3 x 10
- Naziv — 3 x 15

Obroci:
- Doručak: ...
- Ručak: ...
- Večera: ...

Kalorije: ... kcal
Protein: ... g
Voda: ... L

UTORKA — ODMOR

Obroci:
- Doručak: ...
- Ručak: ...
- Večera: ...

Kalorije: ... kcal
Protein: ... g
Voda: ... L

[ISTI FORMAT ZA SRIJEDU, ČETVRTAK, PETAK, SUBOTU I NEDELJU]

CILJ: ${goal}
KALORIJE: ... kcal
PROTEIN: ... g
VODA: ... L

VAŽNO:
Odgovor mora sadržati samo plan.
Ne ponavljaj instrukcije.
Ne dodaj tekst nakon završnog reda VODA.
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
              content:
                "You are GymGenie. Create concise, personalized 7-day fitness and meal plans. Follow the user's data exactly. Never repeat the same workout unnecessarily."
            },
            {
              role: "user",
              content: prompt
            }
          ],

          chat_template_kwargs: {
            enable_thinking: false
          },

          max_completion_tokens: 1800,
          temperature: 0.4
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
        .filter(
          item => item?.type === "text" || typeof item === "string"
        )
        .map(item =>
          typeof item === "string" ? item : item.text || ""
        )
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
