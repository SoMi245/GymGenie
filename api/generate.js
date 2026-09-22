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

    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);
    const d = Number(trainingDays);
    const m = Number(meals);

    if (
      !Number.isFinite(h) ||
      !Number.isFinite(w) ||
      !Number.isFinite(a) ||
      !Number.isFinite(d) ||
      !Number.isFinite(m) ||
      h <= 0 ||
      w <= 0 ||
      a <= 0 ||
      d < 1 ||
      d > 7 ||
      m < 2 ||
      m > 6
    ) {
      return res.status(400).json({
        error: "Provjeri unesene podatke."
      });
    }

    /*
      OSNOVNE OKVIRNE VRIJEDNOSTI

      Frontend više NE računa ove vrijednosti.
      Backend ih izračuna jednom i šalje ih zajedno sa planom.
    */

    const bmi = w / Math.pow(h / 100, 2);

    let calories = Math.round(w * 30);

    if (a >= 18) {
      if (goal === "Mršavljenje") {
        calories = Math.max(1800, calories - 250);
      }

      if (goal === "Dobijanje mišićne mase") {
        calories += 250;
      }
    }

    const protein = Math.round(w * 1.6);
    const water = Math.round(w * 0.035 * 10) / 10;

    /*
      Raspored treninga.
      AI mora koristiti TAČNO ove dane.
    */

    const schedules = {
      1: ["PONEDJELJAK"],
      2: ["PONEDJELJAK", "ČETVRTAK"],
      3: ["PONEDJELJAK", "SRIJEDA", "PETAK"],
      4: ["PONEDJELJAK", "UTORAK", "ČETVRTAK", "SUBOTA"],
      5: ["PONEDJELJAK", "UTORAK", "ČETVRTAK", "PETAK", "SUBOTA"],
      6: [
        "PONEDJELJAK",
        "UTORAK",
        "SRIJEDA",
        "ČETVRTAK",
        "PETAK",
        "SUBOTA"
      ],
      7: [
        "PONEDJELJAK",
        "UTORAK",
        "SRIJEDA",
        "ČETVRTAK",
        "PETAK",
        "SUBOTA",
        "NEDELJA"
      ]
    };

    const trainingSchedule = schedules[d].join(", ");

    /*
      Dozvoljene vježbe.

      AI ne smije izmišljati nazive.
    */

    let exerciseRules = "";

    if (location === "Kuća - bez opreme") {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
- Sklekovi
- Sklekovi na koljenima
- Uski sklekovi
- Široki sklekovi
- Čučanj
- Iskorak
- Obrnuti iskorak
- Bugarski čučanj
- Glute bridge
- Podizanje na prste
- Plank
- Bočni plank
- Dead bug
- Bird dog
- Mountain climbers
- Jumping jacks
- Superman

ZABRANJENO:
- Zgibovi
- Bench press
- Bučice
- Šipke
- Sprave
- Sajle
- Bilo kakva oprema
`;
    } else if (location === "Kuća - osnovna oprema") {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
- Sklekovi
- Uski sklekovi
- Široki sklekovi
- Čučanj
- Goblet čučanj
- Iskorak
- Bugarski čučanj
- Rumunsko mrtvo dizanje sa bučicama
- Veslanje sa bučicom
- Potisak bučicama iznad glave
- Biceps pregib sa bučicama
- Triceps opružanje sa bučicom
- Glute bridge
- Podizanje na prste
- Plank
- Bočni plank
- Dead bug
- Bird dog
- Mountain climbers
`;
    } else {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
- Bench press
- Incline bench press
- Chest press
- Lat pulldown
- Zgibovi
- Veslanje na sajli
- Veslanje sa šipkom
- Shoulder press
- Lateral raise
- Biceps pregib
- Hammer pregib
- Triceps pushdown
- Čučanj sa šipkom
- Leg press
- Rumunsko mrtvo dizanje
- Iskorak
- Leg curl
- Leg extension
- Hip thrust
- Podizanje na prste
- Plank
- Cable crunch
- Hanging knee raise
`;
    }

    const prompt = `
TI SI GYMGENIE AI TRENER.

NAPRAVI KRATAK, REALAN I PERSONALIZOVAN PLAN ZA 7 DANA.

PODACI:

Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

TAČAN RASPORED TRENINGA:
${trainingSchedule}

${exerciseRules}

STROGA PRAVILA:

1. Moraš prikazati svih 7 dana.

2. TRENING mora biti samo na danima iz ovog rasporeda:
${trainingSchedule}

3. Svi ostali dani moraju biti ODMOR.

4. Na dan treninga koristi 4 do 5 vježbi.

5. Koristi samo vježbe iz DOZVOLJENE LISTE.

6. Ne izmišljaj nazive vježbi.

7. Ne koristi engleske nazive ako postoji normalan naziv na srpskom/bosanskom.

8. Ne ponavljaj potpuno isti trening.

9. Trening prilagodi:
- nivou: ${experience}
- cilju: ${goal}
- mjestu: ${location}

10. Svaki dan mora imati TAČNO ${m} obroka.

11. Nemoj koristiti isti kompletan jelovnik svakog dana.

12. Koristi normalne namirnice i različite izvore proteina, ugljikohidrata, voća i povrća.

13. Kalorije, protein i voda su OKVIRNE vrijednosti.

14. Koristi ove vrijednosti SVAKI DAN:

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

15. Na kraju koristi potpuno iste vrijednosti.

16. Bez uvoda.

17. Bez objašnjenja vježbi.

18. Bez napomena.

19. Bez ponavljanja instrukcija.

20. Nakon NEDELJE odmah završi.

FORMAT:

PONEDJELJAK — TRENING

Vježbe:
- Vježba — 3 x 10
- Vježba — 3 x 12
- Vježba — 3 x 10
- Vježba — 3 x 12

Obroci:
- Doručak: ...
- Obrok 2: ...
- Ručak: ...
- Večera: ...

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

Za ODMOR napiši:

DAN — ODMOR

Obroci:
- ...
- ...

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

Na kraju:

CILJ: ${goal}
KALORIJE: ${calories} kcal
PROTEIN: ${protein} g
VODA: ${water} L
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
                "You are GymGenie. Follow the user's data exactly. Use only real exercises from the provided list. Never invent exercise names. Return only the requested 7-day plan."
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
          temperature: 0.2
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

    if (!plan.trim()) {
      console.error("Cloudflare response:", JSON.stringify(data));

      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    return res.status(200).json({
      plan,
      stats: {
        bmi: Number(bmi.toFixed(1)),
        calories,
        protein,
        water
      }
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Greška servera: " + (error?.message || "Nepoznata greška.")
    });
  }
}
