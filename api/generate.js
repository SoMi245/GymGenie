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

    const days = [
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
Sklekovi, sklekovi na koljenima, uski sklekovi,
široki sklekovi, čučanj, iskorak, obrnuti iskorak,
bugarski čučanj, glute bridge, podizanje na prste,
plank, bočni plank, dead bug, bird dog,
mountain climbers, jumping jacks, superman.
NE KORISTI OPREMU.
`;
    } else if (location === "Kuća - osnovna oprema") {
      exerciseRules = `
Sklekovi, uski sklekovi, široki sklekovi, čučanj,
goblet čučanj, iskorak, bugarski čučanj,
rumunsko mrtvo dizanje sa bučicama,
veslanje sa bučicom, potisak bučicama iznad glave,
biceps pregib sa bučicama, triceps opružanje,
glute bridge, podizanje na prste, plank,
bočni plank, dead bug, bird dog, mountain climbers.
`;
    } else {
      exerciseRules = `
Bench press, incline bench press, chest press,
lat pulldown, zgibovi, veslanje na sajli,
veslanje sa šipkom, shoulder press, lateral raise,
biceps pregib, hammer pregib, triceps pushdown,
čučanj sa šipkom, leg press,
rumunsko mrtvo dizanje, iskorak, leg curl,
leg extension, hip thrust, podizanje na prste,
plank, cable crunch, hanging knee raise.
`;
    }

    const systemPrompt = `
Ti si GymGenie AI trener.

Vrati ISKLJUČIVO validan JSON.
Bez markdowna.
Bez ```json.
Bez teksta prije ili poslije JSON-a.

FORMAT:

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

OBAVEZNA PRAVILA:

- Tačno 7 dana.
- Redoslijed dana mora biti:
PONEDJELJAK, UTORAK, SRIJEDA, ČETVRTAK, PETAK, SUBOTA, NEDELJA.
- Tačno ${d} dana imaju "type": "TRENING".
- Svi ostali imaju "type": "ODMOR".
- ODMOR mora imati exercises: [].
- TRENING mora imati 4 vježbe.
- Svaki dan mora imati tačno ${m} obroka.
- Nikada nemoj dodati ${m + 1}. obrok.
- Nikada nemoj izostaviti obrok.
- Svaki obrok ima samo name i description.
- Svaka vježba ima samo name, sets, reps i rest.
- calories, protein i water su brojevi.
- Ne dodaj dodatna polja.
- Koristi samo dozvoljene vježbe.
- Ne mijenjaj broj trening dana.
- Ne mijenjaj broj obroka.
- NEDELJA mora uvijek postojati.
- Na dan odmora i dalje mora biti ${m} obroka.

Budi kratak u opisima obroka kako bi cijeli JSON ostao mali.
`;

    const userPrompt = `
NAPRAVI PLAN:

Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

DANI TRENINGA:
${trainingSchedule.join(", ")}

CILJNE VRIJEDNOSTI:
Kalorije: ${calories}
Protein: ${protein} g
Voda: ${water} L

DOZVOLJENE VJEŽBE:
${exerciseRules}

VRATI SAMO JSON.
`;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    let response;

    try {
      response = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
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

      if (error?.name === "AbortError") {
        return res.status(504).json({
          error: "AI odgovor traje predugo. Pokušaj ponovo."
        });
      }

      return res.status(502).json({
        error: "Nije moguće povezati se sa AI servisom."
      });
    }

    clearTimeout(timeout);

    const responseText = await response.text();

    let cloudflareData;

    try {
      cloudflareData = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error:
          "Cloudflare je vratio neispravan odgovor.",
        details: responseText.slice(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        error:
          cloudflareData?.error?.message ||
          cloudflareData?.errors?.[0]?.message ||
          "Cloudflare AI greška."
      });
    }

    let content =
      cloudflareData?.choices?.[0]?.message?.content;

    if (Array.isArray(content)) {
      content = content
        .map(item =>
          typeof item === "string"
            ? item
            : item?.text || ""
        )
        .join("");
    }

    if (typeof content !== "string" || !content.trim()) {
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
      return res.status(502).json({
        error: "AI nije vratio validan JSON."
      });
    }

    clean = clean.slice(firstBrace, lastBrace + 1);

    let plan;

    try {
      plan = JSON.parse(clean);
    } catch {
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

    const expectedDays = [
      "PONEDJELJAK",
      "UTORAK",
      "SRIJEDA",
      "ČETVRTAK",
      "PETAK",
      "SUBOTA",
      "NEDELJA"
    ];

    for (let i = 0; i < 7; i++) {
      const day = plan.days[i];

      if (!day || day.day !== expectedDays[i]) {
        return res.status(502).json({
          error: `AI je pogrešno napravio dan ${i + 1}.`
        });
      }

      const shouldTrain =
        trainingSchedule.includes(day.day);

      if (
        (shouldTrain && day.type !== "TRENING") ||
        (!shouldTrain && day.type !== "ODMOR")
      ) {
        return res.status(502).json({
          error: `AI je pogrešno postavio trening za ${day.day}.`
        });
      }

      if (!Array.isArray(day.meals) || day.meals.length !== m) {
        return res.status(502).json({
          error: `${day.day} mora imati tačno ${m} obroka.`
        });
      }

      if (!Array.isArray(day.exercises)) {
        return res.status(502).json({
          error: `${day.day}: exercises nije lista.`
        });
      }

      if (
        day.type === "TRENING" &&
        day.exercises.length !== 4
      ) {
        return res.status(502).json({
          error: `${day.day} mora imati 4 vježbe.`
        });
      }

      if (
        day.type === "ODMOR" &&
        day.exercises.length !== 0
      ) {
        return res.status(502).json({
          error: `${day.day} ne smije imati vježbe.`
        });
      }

      if (
        typeof day.calories !== "number" ||
        typeof day.protein !== "number" ||
        typeof day.water !== "number"
      ) {
        return res.status(502).json({
          error: `${day.day}: neispravne nutritivne vrijednosti.`
        });
      }
    }

    return res.status(200).json({
      plan: JSON.stringify(plan),
      stats: {
        bmi: Number(bmi.toFixed(1)),
        calories,
        protein,
        water
      }
    });

  } catch (error) {
    console.error("GYMGENIE SERVER ERROR:", error);

    return res.status(500).json({
      error:
        "Greška servera: " +
        (error?.message || "Nepoznata greška.")
    });
  }
}
