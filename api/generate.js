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

    const allDays = [
      "PONEDJELJAK",
      "UTORAK",
      "SRIJEDA",
      "ČETVRTAK",
      "PETAK",
      "SUBOTA",
      "NEDELJA"
    ];

    const schedules = {
      1: ["PONEDJELJAK"],
      2: ["PONEDJELJAK", "ČETVRTAK"],
      3: ["PONEDJELJAK", "SRIJEDA", "PETAK"],
      4: ["PONEDJELJAK", "UTORAK", "ČETVRTAK", "SUBOTA"],
      5: [
        "PONEDJELJAK",
        "UTORAK",
        "ČETVRTAK",
        "PETAK",
        "SUBOTA"
      ],
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

    const trainingSchedule = schedules[d];

    let exerciseRules = "";

    if (location === "Kuća - bez opreme") {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
Sklekovi
Sklekovi na koljenima
Uski sklekovi
Široki sklekovi
Čučanj
Iskorak
Obrnuti iskorak
Bugarski čučanj
Glute bridge
Podizanje na prste
Plank
Bočni plank
Dead bug
Bird dog
Mountain climbers
Jumping jacks
Superman

ZABRANJENO:
Zgibovi
Bench press
Bučice
Šipke
Sprave
Sajle
Bilo kakva oprema
`;
    } else if (location === "Kuća - osnovna oprema") {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
Sklekovi
Uski sklekovi
Široki sklekovi
Čučanj
Goblet čučanj
Iskorak
Bugarski čučanj
Rumunsko mrtvo dizanje sa bučicama
Veslanje sa bučicom
Potisak bučicama iznad glave
Biceps pregib sa bučicama
Triceps opružanje sa bučicom
Glute bridge
Podizanje na prste
Plank
Bočni plank
Dead bug
Bird dog
Mountain climbers
`;
    } else {
      exerciseRules = `
DOZVOLJENE VJEŽBE:
Bench press
Incline bench press
Chest press
Lat pulldown
Zgibovi
Veslanje na sajli
Veslanje sa šipkom
Shoulder press
Lateral raise
Biceps pregib
Hammer pregib
Triceps pushdown
Čučanj sa šipkom
Leg press
Rumunsko mrtvo dizanje
Iskorak
Leg curl
Leg extension
Hip thrust
Podizanje na prste
Plank
Cable crunch
Hanging knee raise
`;
    }

    const systemPrompt = `
TI SI GYMGENIE AI TRENER.

MORAŠ VRATITI ISKLJUČIVO VALIDAN JSON.

NE PIŠI MARKDOWN.
NE PIŠI ```json.
NE PIŠI UVOD.
NE PIŠI OBJAŠNJENJE.
NE PIŠI TEKST IZVAN JSON-A.

JSON MORA IMATI OVU STRUKTURU:

{
  "days": [
    {
      "day": "PONEDJELJAK",
      "type": "TRENING",
      "exercises": [
        {
          "name": "Sklekovi",
          "sets": 3,
          "reps": "10",
          "rest": "60 sekundi"
        }
      ],
      "meals": [
        {
          "name": "Doručak",
          "description": "Jaja, hljeb i jogurt"
        }
      ],
      "calories": 2000,
      "protein": 130,
      "water": 2.5
    }
  ]
}

PRAVILA KOJA NE SMIJEŠ PREKRŠITI:

1. "days" MORA imati TAČNO 7 elemenata.

2. Dani MORAJU biti tačno ovim redom:
PONEDJELJAK
UTORAK
SRIJEDA
ČETVRTAK
PETAK
SUBOTA
NEDELJA

3. "type" može biti samo:
"TRENING"
ili
"ODMOR"

4. TAČNO ${d} dana mora imati type "TRENING".

5. SVI OSTALI dani moraju imati type "ODMOR".

6. Na dan ODMOR "exercises" mora biti prazna lista [].

7. Na dan TRENING mora biti 4 ili 5 vježbi.

8. SVAKI dan MORA imati TAČNO ${m} elemenata u "meals".

9. Ne dodaj nijedan dodatni obrok.

10. Ne izostavljaj nijedan obrok.

11. "meals" mora biti niz objekata sa:
"name"
"description"

12. "calories", "protein" i "water" moraju biti brojevi.

13. Ne dodaj dodatna polja.

14. Koristi samo dozvoljene vježbe.

15. Ako je dan odmora, i dalje mora imati svih ${m} obroka.

16. Ne mijenjaj broj trening dana.

17. Ne mijenjaj broj obroka.

18. Ne izostavljaj NEDELJU.

19. Ne dodaj osmi dan.

20. Vraćaj samo JSON.
`;

    const userPrompt = `
NAPRAVI PLAN PREMA OVIM PODACIMA:

Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

TAČNI DANI TRENINGA:
${trainingSchedule.join(", ")}

SVI OSTALI DANI SU ODMOR.

CILJNE VRIJEDNOSTI:
Kalorije: ${calories}
Protein: ${protein} g
Voda: ${water} L

${exerciseRules}

VRATI TAČNO 7 DANA U JSON FORMATU.
`;

    function cleanJson(text) {
      let result = String(text || "").trim();

      result = result
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const firstBrace = result.indexOf("{");
      const lastBrace = result.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        result = result.slice(firstBrace, lastBrace + 1);
      }

      return result;
    }

    function validatePlan(data) {
      if (!data || typeof data !== "object") {
        return "Odgovor nije JSON objekat.";
      }

      if (!Array.isArray(data.days)) {
        return "Nedostaje days lista.";
      }

      if (data.days.length !== 7) {
        return `Plan ima ${data.days.length}/7 dana.`;
      }

      const expectedDays = [
        "PONEDJELJAK",
        "UTORAK",
        "SRIJEDA",
        "ČETVRTAK",
        "PETAK",
        "SUBOTA",
        "NEDELJA"
      ];

      const expectedTraining = new Set(trainingSchedule);

      let trainingCount = 0;

      for (let i = 0; i < 7; i++) {
        const day = data.days[i];

        if (!day || typeof day !== "object") {
          return `Dan ${i + 1} nije validan objekat.`;
        }

        if (day.day !== expectedDays[i]) {
          return `Pogrešan dan na poziciji ${i + 1}.`;
        }

        if (day.type !== "TRENING" && day.type !== "ODMOR") {
          return `${day.day}: neispravan type.`;
        }

        const shouldTrain = expectedTraining.has(day.day);

        if (shouldTrain && day.type !== "TRENING") {
          return `${day.day} mora biti TRENING.`;
        }

        if (!shouldTrain && day.type !== "ODMOR") {
          return `${day.day} mora biti ODMOR.`;
        }

        if (day.type === "TRENING") {
          trainingCount++;

          if (!Array.isArray(day.exercises)) {
            return `${day.day}: nedostaje exercises.`;
          }

          if (
            day.exercises.length < 4 ||
            day.exercises.length > 5
          ) {
            return `${day.day}: mora imati 4-5 vježbi.`;
          }

          for (const exercise of day.exercises) {
            if (
              !exercise ||
              typeof exercise !== "object" ||
              typeof exercise.name !== "string" ||
              typeof exercise.sets !== "number" ||
              typeof exercise.reps !== "string" ||
              typeof exercise.rest !== "string"
            ) {
              return `${day.day}: neispravna vježba.`;
            }
          }
        } else {
          if (!Array.isArray(day.exercises)) {
            return `${day.day}: exercises mora biti [].`;
          }

          if (day.exercises.length !== 0) {
            return `${day.day}: dan odmora ne smije imati vježbe.`;
          }
        }

        if (!Array.isArray(day.meals)) {
          return `${day.day}: nedostaje meals.`;
        }

        if (day.meals.length !== m) {
          return `${day.day}: ima ${day.meals.length}/${m} obroka.`;
        }

        for (const meal of day.meals) {
          if (
            !meal ||
            typeof meal !== "object" ||
            typeof meal.name !== "string" ||
            typeof meal.description !== "string"
          ) {
            return `${day.day}: neispravan obrok.`;
          }
        }

        if (
          typeof day.calories !== "number" ||
          typeof day.protein !== "number" ||
          typeof day.water !== "number"
        ) {
          return `${day.day}: nutritivne vrijednosti nisu validne.`;
        }
      }

      if (trainingCount !== d) {
        return `Broj treninga ${trainingCount}/${d}.`;
      }

      return null;
    }

    async function askAI() {
      const response = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Authorization":
              "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            model: "@cf/zai-org/glm-4.7-flash",

            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: userPrompt
              }
            ],

            chat_template_kwargs: {
              enable_thinking: false
            },

            max_completion_tokens: 5000,

            temperature: 0.1
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
          data?.errors?.[0]?.message ||
          "Cloudflare AI greška."
        );
      }

      let content =
        data?.choices?.[0]?.message?.content;

      if (Array.isArray(content)) {
        content = content
          .map(item =>
            typeof item === "string"
              ? item
              : item?.text || ""
          )
          .join("");
      }

      return cleanJson(content);
    }

    let lastError = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const raw = await askAI();

        let parsed;

        try {
          parsed = JSON.parse(raw);
        } catch (jsonError) {
          lastError = "AI nije vratio validan JSON.";
          continue;
        }

        const validationError =
          validatePlan(parsed);

        if (validationError) {
          lastError = validationError;
          continue;
        }

        return res.status(200).json({
          plan: JSON.stringify(parsed),

          stats: {
            bmi: Number(bmi.toFixed(1)),
            calories,
            protein,
            water
          }
        });

      } catch (error) {
        console.error(
          `AI pokušaj ${attempt}:`,
          error
        );

        lastError =
          error?.message ||
          "AI greška.";
      }
    }

    return res.status(502).json({
      error:
        "AI nije napravio validan plan. " +
        lastError
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error:
        "Greška servera: " +
        (error?.message || "Nepoznata greška.")
    });
  }
}
