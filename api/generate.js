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

    /*
      TAČAN RASPORED TRENINGA
    */

    const schedules = {
      1: ["PONEDJELJAK"],

      2: [
        "PONEDJELJAK",
        "ČETVRTAK"
      ],

      3: [
        "PONEDJELJAK",
        "SRIJEDA",
        "PETAK"
      ],

      4: [
        "PONEDJELJAK",
        "UTORAK",
        "ČETVRTAK",
        "SUBOTA"
      ],

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

    /*
      DOZVOLJENE VJEŽBE
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

    /*
      AI PROMPT

      BITNO:
      AI mora koristiti TAČAN broj treninga
      i TAČAN broj obroka.
    */

    const prompt = `
TI SI GYMGENIE AI TRENER.

NAPRAVI PLAN ZA TAČNO 7 DANA.

PODACI KORISNIKA:

Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

==================================================
STROGA PRAVILA ZA TRENING
==================================================

MORAŠ imati TAČNO ${d} dana sa treningom.

MORAŠ koristiti OVE I SAMO OVE DANE:

${trainingSchedule.map(day => `- ${day}`).join("\n")}

SVI OSTALI DANI MORAJU BITI:

- ODMOR

NE SMIJEŠ dodati trening na drugi dan.

NE SMIJEŠ imati više od ${d} treninga.

NE SMIJEŠ imati manje od ${d} treninga.

==================================================
STROGA PRAVILA ZA OBROKE
==================================================

SVAKI OD 7 DANA MORA imati TAČNO ${m} obroka.

Ako je broj obroka ${m}, svaki dan mora imati ${m} i SAMO ${m} stavki.

NEMA dodatnih obroka.

NEMA manje obroka.

NEMA više obroka.

==================================================
TRENING
==================================================

Na svakom trening danu koristi 4 do 5 vježbi.

Ne ponavljaj potpuno isti trening.

Koristi samo dozvoljene vježbe.

${exerciseRules}

==================================================
ISHRANA
==================================================

Svaki dan koristi različite kombinacije hrane.

Nemoj kopirati kompletan jelovnik drugog dana.

Koristi normalne namirnice.

Ne izmišljaj nepostojeće namirnice.

Kalorije, protein i voda su OKVIRNE vrijednosti.

Cilj korisnika je:

${goal}

==================================================
VRIJEDNOSTI
==================================================

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

==================================================
FORMAT
==================================================

MORAŠ prikazati svih 7 dana.

Za trening:

DAN — TRENING

Vježbe:
- Vježba — 3 x 10
- Vježba — 3 x 12
- Vježba — 3 x 10
- Vježba — 3 x 12

Obroci:
- Doručak: ...
- Obrok 2: ...
- Obrok 3: ...
${m >= 4 ? "- Obrok 4: ...\n" : ""}${m >= 5 ? "- Obrok 5: ...\n" : ""}${m >= 6 ? "- Obrok 6: ...\n" : ""}
Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

Za dan odmora:

DAN — ODMOR

Obroci:
- Doručak: ...
- Obrok 2: ...
- Obrok 3: ...
${m >= 4 ? "- Obrok 4: ...\n" : ""}${m >= 5 ? "- Obrok 5: ...\n" : ""}${m >= 6 ? "- Obrok 6: ...\n" : ""}
Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

Na samom kraju:

CILJ: ${goal}
KALORIJE: ${calories} kcal
PROTEIN: ${protein} g
VODA: ${water} L

NEMOJ dodavati ništa poslije toga.
`;

    /*
      CLOUDFLARE AI
    */

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
              content:
                "You are GymGenie. Follow the requested number of training days and meals EXACTLY. Never add or remove training days or meals. Return only the requested 7-day plan."
            },

            {
              role: "user",
              content: prompt
            }
          ],

          chat_template_kwargs: {
            enable_thinking: false
          },

          max_completion_tokens: 2200,

          temperature: 0.15
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
          item =>
            item?.type === "text" ||
            typeof item === "string"
        )
        .map(item =>
          typeof item === "string"
            ? item
            : item.text || ""
        )
        .join("");
    }

    if (!plan.trim()) {
      return res.status(502).json({
        error: "AI nije vratio plan."
      });
    }

    /*
      ==================================================
      AUTOMATSKA VALIDACIJA
      ==================================================

      AI rezultat NE prolazi ako broj treninga nije tačan
      ili ako broj obroka nije tačan.
    */

    const normalizedPlan = plan
      .toUpperCase()
      .replace(/\r/g, "");

    const dayNames = [
      "PONEDJELJAK",
      "UTORAK",
      "SRIJEDA",
      "ČETVRTAK",
      "PETAK",
      "SUBOTA",
      "NEDELJA"
    ];

    /*
      1. PROVJERA DA POSTOJI SVIH 7 DANA
    */

    const missingDays = dayNames.filter(
      day => !normalizedPlan.includes(day)
    );

    if (missingDays.length > 0) {
      console.error(
        "Nedostaju dani:",
        missingDays
      );

      return res.status(502).json({
        error:
          "AI je napravio neispravan plan. Nisu prikazani svi dani."
      });
    }

    /*
      2. PROVJERA BROJA TRENINGA

      Tražimo "DAN — TRENING".
    */

    const trainingMatches =
      normalizedPlan.match(
        /(?:PONEDJELJAK|UTORAK|SRIJEDA|ČETVRTAK|PETAK|SUBOTA|NEDELJA)\s*[—-]\s*TRENING/g
      ) || [];

    const actualTrainingDays =
      trainingMatches.length;

    if (actualTrainingDays !== d) {
      console.error(
        "Pogrešan broj trening dana:",
        actualTrainingDays,
        "očekivano:",
        d
      );

      return res.status(502).json({
        error:
          `AI je napravio ${actualTrainingDays} treninga umjesto ${d}. Pokušaj ponovo.`
      });
    }

    /*
      3. PROVJERA BROJA ODMORA
    */

    const restMatches =
      normalizedPlan.match(
        /(?:PONEDJELJAK|UTORAK|SRIJEDA|ČETVRTAK|PETAK|SUBOTA|NEDELJA)\s*[—-]\s*ODMOR/g
      ) || [];

    const actualRestDays =
      restMatches.length;

    if (actualRestDays !== 7 - d) {
      console.error(
        "Pogrešan broj dana odmora:",
        actualRestDays,
        "očekivano:",
        7 - d
      );

      return res.status(502).json({
        error:
          "AI je napravio neispravan raspored treninga i odmora. Pokušaj ponovo."
      });
    }

    /*
      4. PROVJERA BROJA OBROKA

      Svaki dan mora imati TAČNO ${m} obroka.

      Brojimo:
      Doručak
      Obrok 2
      Obrok 3
      Obrok 4
      Obrok 5
      Obrok 6
    */

    const mealLabels = [
      "DORUČAK",
      "OBROK 2",
      "OBROK 3",
      "OBROK 4",
      "OBROK 5",
      "OBROK 6"
    ];

    /*
      Podijelimo plan na 7 dnevnih blokova.
    */

    const dayRegex =
      /(?:PONEDJELJAK|UTORAK|SRIJEDA|ČETVRTAK|PETAK|SUBOTA|NEDELJA)\s*[—-]/g;

    const dayPositions = [];

    let match;

    while ((match = dayRegex.exec(normalizedPlan)) !== null) {
      dayPositions.push({
        index: match.index,
        day: match[0]
      });
    }

    if (dayPositions.length !== 7) {
      return res.status(502).json({
        error:
          "AI nije pravilno podijelio plan na 7 dana. Pokušaj ponovo."
      });
    }

    for (let i = 0; i < 7; i++) {
      const start = dayPositions[i].index;

      const end =
        i < 6
          ? dayPositions[i + 1].index
          : normalizedPlan.length;

      const dayBlock =
        normalizedPlan.slice(start, end);

      let mealCount = 0;

      for (const label of mealLabels) {
        if (
          dayBlock.includes(
            `- ${label}:`
          ) ||
          dayBlock.includes(
            `-${label}:`
          )
        ) {
          mealCount++;
        }
      }

      /*
        Ako je format drugačiji, pokušaj
        dodatno prebrojati same oznake.
      */

      if (mealCount !== m) {
        console.error(
          `Dan ${i + 1}: ${mealCount} obroka, očekivano ${m}`
        );

        return res.status(502).json({
          error:
            `AI je napravio neispravan broj obroka na danu ${i + 1}. Pokušaj ponovo.`
        });
      }
    }

    /*
      SVE JE PROŠLO VALIDACIJU
    */

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
    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        "Greška servera: " +
        (error?.message || "Nepoznata greška.")
    });
  }
}
