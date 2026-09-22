module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Koristi POST zahtjev."
    });
  }

  try {
    const body = req.body || {};

    const h = Number(body.height);
    const w = Number(body.weight);
    const a = Number(body.age);
    const d = Number(body.trainingDays);
    const m = Number(body.meals);

    const experience = body.experience || "";
    const goal = body.goal || "";
    const location = body.location || "";

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

    const token = process.env.CLOUDFLARE_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "CLOUDFLARE_API_TOKEN nije podešen u Vercelu."
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
      7: allDays
    };

    const trainingSchedule = schedules[d];

    let exerciseRules;

    if (location === "Kuća - bez opreme") {
      exerciseRules = [
        "Sklekovi",
        "Sklekovi na koljenima",
        "Uski sklekovi",
        "Široki sklekovi",
        "Čučanj",
        "Iskorak",
        "Obrnuti iskorak",
        "Bugarski čučanj",
        "Glute bridge",
        "Podizanje na prste",
        "Plank",
        "Bočni plank",
        "Dead bug",
        "Bird dog",
        "Mountain climbers",
        "Jumping jacks",
        "Superman"
      ];
    } else if (location === "Kuća - osnovna oprema") {
      exerciseRules = [
        "Sklekovi",
        "Uski sklekovi",
        "Široki sklekovi",
        "Čučanj",
        "Goblet čučanj",
        "Iskorak",
        "Bugarski čučanj",
        "Rumunsko mrtvo dizanje sa bučicama",
        "Veslanje sa bučicom",
        "Potisak bučicama iznad glave",
        "Biceps pregib sa bučicama",
        "Triceps opružanje sa bučicom",
        "Glute bridge",
        "Podizanje na prste",
        "Plank",
        "Bočni plank",
        "Dead bug",
        "Bird dog",
        "Mountain climbers"
      ];
    } else {
      exerciseRules = [
        "Bench press",
        "Incline bench press",
        "Chest press",
        "Lat pulldown",
        "Zgibovi",
        "Veslanje na sajli",
        "Veslanje sa šipkom",
        "Shoulder press",
        "Lateral raise",
        "Biceps pregib",
        "Hammer pregib",
        "Triceps pushdown",
        "Čučanj sa šipkom",
        "Leg press",
        "Rumunsko mrtvo dizanje",
        "Iskorak",
        "Leg curl",
        "Leg extension",
        "Hip thrust",
        "Podizanje na prste",
        "Plank",
        "Cable crunch",
        "Hanging knee raise"
      ];
    }

    const systemPrompt = `
TI SI GYMGENIE AI TRENER.

VRATI ISKLJUČIVO VALIDAN JSON.
NE PIŠI MARKDOWN.
NE PIŠI ```json.
NE PIŠI OBJAŠNJENJE.
NE PIŠI NIŠTA IZVAN JSON OBJEKTA.

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

PRAVILA KOJA MORAŠ POŠTOVATI:

1. Mora postojati TAČNO 7 dana.
2. Dani MORAJU biti ovim redom:
PONEDJELJAK
UTORAK
SRIJEDA
ČETVRTAK
PETAK
SUBOTA
NEDELJA

3. TAČNO ${d} dana moraju imati type "TRENING".
4. Svi ostali dani moraju imati type "ODMOR".
5. Dan "ODMOR" mora imati exercises: [].
6. Svaki dan "TRENING" mora imati TAČNO 4 vježbe.
7. Svaki dan mora imati TAČNO ${m} obroka.
8. Svaki obrok mora imati samo:
   name
   description
9. Svaka vježba mora imati samo:
   name
   sets
   reps
   rest
10. calories mora biti broj.
11. protein mora biti broj.
12. water mora biti broj.
13. Ne dodaj dodatna polja.
14. Ne mijenjaj broj trening dana.
15. Ne mijenjaj broj obroka.
16. NEDELJA MORA POSTOJATI.
17. Koristi samo dozvoljene vježbe.
18. Za treninge koristi realne serije, ponavljanja i odmor.
19. Obroci moraju biti različiti i realni.
20. Vrati samo JSON.
`;

    const userPrompt = `
NAPRAVI PERSONALIZOVANI GYMGENIE PLAN.

VISINA:
${h} cm

TEŽINA:
${w} kg

GODINE:
${a}

ISKUSTVO:
${experience}

CILJ:
${goal}

TRENINGA SEDMIČNO:
${d}

MJESTO TRENINGA:
${location}

OBROKA DNEVNO:
${m}

DANI KOJI MORAJU BITI TRENING:
${trainingSchedule.join(", ")}

DANI KOJI MORAJU BITI ODMOR:
${allDays.filter(function(day) {
  return !trainingSchedule.includes(day);
}).join(", ") || "NEMA"}

CILJNE VRIJEDNOSTI:
Kalorije: ${calories}
Protein: ${protein} g
Voda: ${water} L

DOZVOLJENE VJEŽBE:
${exerciseRules.join(", ")}

NAPRAVI SVIH 7 DANA.

VRATI ISKLJUČIVO JSON.
`;

    const controller = new AbortController();

    const timeout = setTimeout(function() {
      controller.abort();
    }, 50000);

    let response;

    try {
      response = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": "Bearer " + token,
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
            max_completion_tokens: 3000,
            temperature: 0.1
          })
        }
      );
    } catch (error) {
      clearTimeout(timeout);

      if (error && error.name === "AbortError") {
        return res.status(504).json({
          error: "AI odgovor traje predugo. Pokušaj ponovo."
        });
      }

      console.error("CLOUDFLARE FETCH ERROR:", error);

      return res.status(502).json({
        error: "Nije moguće povezati se sa Cloudflare AI servisom."
      });
    }

    clearTimeout(timeout);

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("CLOUDFLARE RAW RESPONSE:", responseText);

      return res.status(502).json({
        error: "Cloudflare je vratio neispravan odgovor."
      });
    }

    if (!response.ok) {
      console.error("CLOUDFLARE ERROR:", data);

      return res.status(502).json({
        error:
          data &&
          data.error &&
          data.error.message
            ? data.error.message
            : "Cloudflare AI greška."
      });
    }

    let content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (Array.isArray(content)) {
      content = content
        .map(function(item) {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item.text === "string") {
            return item.text;
          }

          return "";
        })
        .join("");
    }

    if (
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    let clean = content.trim();

    clean = clean
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("AI CONTENT:", clean);

      return res.status(502).json({
        error: "AI nije vratio validan JSON."
      });
    }

    clean = clean.slice(firstBrace, lastBrace + 1);

    let plan;

    try {
      plan = JSON.parse(clean);
    } catch (error) {
      console.error("INVALID AI JSON:", clean);

      return res.status(502).json({
        error: "AI je vratio neispravan JSON."
      });
    }

    if (
      !plan ||
      !Array.isArray(plan.days) ||
      plan.days.length !== 7
    ) {
      return res.status(502).json({
        error: "AI plan nema tačno 7 dana."
      });
    }

    let trainingCount = 0;

    for (let i = 0; i < 7; i++) {
      const day = plan.days[i];

      if (!day || day.day !== allDays[i]) {
        return res.status(502).json({
          error:
            "AI je pogrešno napravio redoslijed dana."
        });
      }

      const shouldTrain =
        trainingSchedule.indexOf(day.day) !== -1;

      if (
        shouldTrain &&
        day.type !== "TRENING"
      ) {
        return res.status(502).json({
          error:
            day.day +
            " mora biti TRENING."
        });
      }

      if (
        !shouldTrain &&
        day.type !== "ODMOR"
      ) {
        return res.status(502).json({
          error:
            day.day +
            " mora biti ODMOR."
        });
      }

      if (day.type === "TRENING") {
        trainingCount++;

        if (
          !Array.isArray(day.exercises) ||
          day.exercises.length !== 4
        ) {
          return res.status(502).json({
            error:
              day.day +
              " mora imati tačno 4 vježbe."
          });
        }

        for (
          let j = 0;
          j < day.exercises.length;
          j++
        ) {
          const exercise = day.exercises[j];

          if (
            !exercise ||
            typeof exercise.name !== "string" ||
            typeof exercise.sets !== "number" ||
            typeof exercise.reps !== "string" ||
            typeof exercise.rest !== "string"
          ) {
            return res.status(502).json({
              error:
                day.day +
                " ima neispravnu vježbu."
            });
          }
        }
      }

      if (day.type === "ODMOR") {
        if (
          !Array.isArray(day.exercises) ||
          day.exercises.length !== 0
        ) {
          return res.status(502).json({
            error:
              day.day +
              " mora imati prazne exercises."
          });
        }
      }

      if (
        !Array.isArray(day.meals) ||
        day.meals.length !== m
      ) {
        return res.status(502).json({
          error:
            day.day +
            " mora imati tačno " +
            m +
            " obroka."
        });
      }

      for (
        let j = 0;
        j < day.meals.length;
        j++
      ) {
        const meal = day.meals[j];

        if (
          !meal ||
          typeof meal.name !== "string" ||
          typeof meal.description !== "string"
        ) {
          return res.status(502).json({
            error:
              day.day +
              " ima neispravan obrok."
          });
        }
      }

      if (
        typeof day.calories !== "number" ||
        typeof day.protein !== "number" ||
        typeof day.water !== "number"
      ) {
        return res.status(502).json({
          error:
            day.day +
            " ima neispravne nutritivne vrijednosti."
        });
      }
    }

    if (trainingCount !== d) {
      return res.status(502).json({
        error:
          "AI je napravio " +
          trainingCount +
          " treninga umjesto " +
          d +
          "."
      });
    }

    return res.status(200).json({
      plan: JSON.stringify(plan),
      stats: {
        bmi: Number(bmi.toFixed(1)),
        calories: calories,
        protein: protein,
        water: water
      }
    });

  } catch (error) {
    console.error(
      "GYMGENIE SERVER ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "Greška servera: " +
        (
          error &&
          error.message
            ? error.message
            : "Nepoznata greška."
        )
    });
  }
};
