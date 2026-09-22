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

    const basePrompt = `
TI SI GYMGENIE AI TRENER.

NAPRAVI TAČNO 7 DANA.

PODACI:
Visina: ${h} cm
Težina: ${w} kg
Godine: ${a}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${d}
Mjesto treninga: ${location}
Obroka dnevno: ${m}

==================================================
NAJVAŽNIJE PRAVILO
==================================================

MORAŠ prikazati SVIH 7 dana.

DANI MORAJU BITI TAČNO:

PONEDJELJAK
UTORAK
SRIJEDA
ČETVRTAK
PETAK
SUBOTA
NEDELJA

NE SMIJEŠ izostaviti nijedan dan.

==================================================
TRENING
==================================================

TAČNO ${d} dana moraju biti označena kao:

DAN — TRENING

Svi ostali dani moraju biti:

DAN — ODMOR

TAČNI DANI ZA TRENING:

${trainingSchedule.map(day => "- " + day).join("\n")}

Ne dodaj trening na bilo koji drugi dan.

Na svakom trening danu koristi 4 do 5 vježbi.

${exerciseRules}

==================================================
OBROCI
==================================================

SVAKI od svih 7 dana mora imati TAČNO ${m} obroka.

Ako je ${m} obroka, koristi:

- Doručak: ...
- Obrok 2: ...
${m >= 3 ? "- Obrok 3: ...\n" : ""}${m >= 4 ? "- Obrok 4: ...\n" : ""}${m >= 5 ? "- Obrok 5: ...\n" : ""}${m >= 6 ? "- Obrok 6: ...\n" : ""}

NEMA dodatnih obroka.

NEMA manje obroka.

==================================================
VRIJEDNOSTI
==================================================

Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

==================================================
FORMAT
==================================================

PONEDJELJAK — TRENING

Vježbe:
- Sklekovi — 3 x 10
- Čučanj — 3 x 12
- Glute bridge — 3 x 15
- Plank — 3 x 45 sekundi

Obroci:
- Doručak: ...
- Obrok 2: ...
${m >= 3 ? "- Obrok 3: ...\n" : ""}${m >= 4 ? "- Obrok 4: ...\n" : ""}${m >= 5 ? "- Obrok 5: ...\n" : ""}${m >= 6 ? "- Obrok 6: ...\n" : ""}
Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

UTORAK — ODMOR

Obroci:
- Doručak: ...
- Obrok 2: ...
${m >= 3 ? "- Obrok 3: ...\n" : ""}${m >= 4 ? "- Obrok 4: ...\n" : ""}${m >= 5 ? "- Obrok 5: ...\n" : ""}${m >= 6 ? "- Obrok 6: ...\n" : ""}
Kalorije: ${calories} kcal
Protein: ${protein} g
Voda: ${water} L

NASTAVI ISTIM FORMATOM ZA SVIH 7 DANA.

NAKON NEDELJE ZAVRŠI.

NE PIŠI UVOD.
NE PIŠI OBJAŠNJENJA.
NE PIŠI INSTRUKCIJE.
`;

    /*
      NORMALIZACIJA TEKSTA
      Omogućava validatoru da prihvati
      mala odstupanja u pisanju.
    */

    function normalize(text) {
      return String(text)
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Đ/g, "D")
        .replace(/\r/g, "")
        .replace(/[–—−]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
    }

    const dayAliases = {
      PONEDJELJAK: ["PONEDJELJAK"],
      UTORAK: ["UTORAK"],
      SRIJEDA: ["SRIJEDA"],
      CETVRTAK: ["CETVRTAK", "ČETVRTAK"],
      PETAK: ["PETAK"],
      SUBOTA: ["SUBOTA"],
      NEDELJA: ["NEDELJA", "NEDJELJA"]
    };

    function hasDay(text, day) {
      const normalized = normalize(text);

      return dayAliases[day].some(alias =>
        normalized.includes(
          normalize(alias)
        )
      );
    }

    function countTrainingDays(text) {
      const normalized = normalize(text);

      let count = 0;

      for (const day of Object.keys(dayAliases)) {
        const aliases = dayAliases[day];

        for (const alias of aliases) {
          const pattern =
            new RegExp(
              normalize(alias) +
              "\\s*-\\s*TRENING\\b",
              "i"
            );

          if (pattern.test(normalized)) {
            count++;
            break;
          }
        }
      }

      return count;
    }

    function countRestDays(text) {
      const normalized = normalize(text);

      let count = 0;

      for (const day of Object.keys(dayAliases)) {
        const aliases = dayAliases[day];

        for (const alias of aliases) {
          const pattern =
            new RegExp(
              normalize(alias) +
              "\\s*-\\s*ODMOR\\b",
              "i"
            );

          if (pattern.test(normalized)) {
            count++;
            break;
          }
        }
      }

      return count;
    }

    function countMealsForDay(block) {
      const normalized = normalize(block);

      let count = 0;

      if (
        /(^|[^A-Z])DORUCAK\s*:/i.test(
          normalized
        )
      ) {
        count++;
      }

      for (let i = 2; i <= 6; i++) {
        const regex = new RegExp(
          `(^|[^A-Z])OBROK\\s*${i}\\s*:`,
          "i"
        );

        if (regex.test(normalized)) {
          count++;
        }
      }

      return count;
    }

    function validatePlan(plan) {
      const normalized = normalize(plan);

      const requiredDays = [
        "PONEDJELJAK",
        "UTORAK",
        "SRIJEDA",
        "CETVRTAK",
        "PETAK",
        "SUBOTA",
        "NEDELJA"
      ];

      /*
        Svih 7 dana mora postojati.
      */

      for (const day of requiredDays) {
        if (!hasDay(plan, day)) {
          return {
            valid: false,
            reason:
              `Nedostaje dan: ${day}`
          };
        }
      }

      /*
        Tačan broj treninga.
      */

      const trainingCount =
        countTrainingDays(plan);

      if (trainingCount !== d) {
        return {
          valid: false,
          reason:
            `Broj treninga: ${trainingCount}/${d}`
        };
      }

      /*
        Tačan broj odmora.
      */

      const restCount =
        countRestDays(plan);

      if (restCount !== 7 - d) {
        return {
          valid: false,
          reason:
            `Broj dana odmora: ${restCount}/${7 - d}`
        };
      }

      /*
        Pronađi početak svakog dana.
      */

      const dayPattern =
        /(PONEDJELJAK|UTORAK|SRIJEDA|CETVRTAK|PETAK|SUBOTA|NEDELJA)\s*-/g;

      const positions = [];

      let match;

      while (
        (match =
          dayPattern.exec(normalized)) !== null
      ) {
        positions.push(match.index);
      }

      /*
        Mora postojati tačno 7 početaka dana.
      */

      if (positions.length !== 7) {
        return {
          valid: false,
          reason:
            `Pronađeno ${positions.length}/7 dana`
        };
      }

      /*
        Provjera obroka za svaki dan.
      */

      for (let i = 0; i < 7; i++) {
        const start =
          positions[i];

        const end =
          i < 6
            ? positions[i + 1]
            : normalized.length;

        const block =
          normalized.slice(
            start,
            end
          );

        const mealCount =
          countMealsForDay(block);

        if (mealCount !== m) {
          return {
            valid: false,
            reason:
              `Dan ${i + 1}: ${mealCount}/${m} obroka`
          };
        }
      }

      return {
        valid: true
      };
    }

    /*
      AI može pokušati do 3 puta.
    */

    let lastReason =
      "AI nije napravio ispravan plan.";

    for (let attempt = 1; attempt <= 3; attempt++) {

      const retryInstruction =
        attempt === 1
          ? ""
          : `

PRETHODNI POKUŠAJ NIJE BIO ISPRAVAN.

OVAJ PUT OBAVEZNO:
- prikaži svih 7 dana
- tačno ${d} trening dana
- tačno ${7 - d} dana odmora
- tačno ${m} obroka SVAKOG dana
- ne izostavljaj NEDELJU
- ne dodaj dodatne dane

Pokušaj broj ${attempt}.
`;

      const response = await fetch(
        "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Authorization":
              "Bearer " +
              process.env.CLOUDFLARE_API_TOKEN,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            model:
              "@cf/zai-org/glm-4.7-flash",

            messages: [
              {
                role: "system",
                content:
                  "You are GymGenie. You MUST output all 7 days. You MUST follow the exact number of training days and meals. Never omit a day. Never add a day."
              },

              {
                role: "user",
                content:
                  basePrompt +
                  retryInstruction
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

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Cloudflare error:",
          data
        );

        return res.status(502).json({
          error:
            data?.error?.message ||
            data?.errors?.[0]?.message ||
            "Cloudflare AI greška."
        });
      }

      const content =
        data?.choices?.[0]?.message?.content;

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
        lastReason =
          "AI nije vratio plan.";
        continue;
      }

      const validation =
        validatePlan(plan);

      if (validation.valid) {
        return res.status(200).json({
          plan,

          stats: {
            bmi:
              Number(
                bmi.toFixed(1)
              ),

            calories,
            protein,
            water
          }
        });
      }

      console.error(
        `AI pokušaj ${attempt} odbijen:`,
        validation.reason
      );

      lastReason =
        validation.reason;
    }

    /*
      Ako sva 3 pokušaja ne prođu,
      vrati jasnu grešku.
    */

    return res.status(502).json({
      error:
        "AI nije uspio napraviti ispravan plan nakon 3 pokušaja. Pokušaj ponovo."
    });

  } catch (error) {

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        "Greška servera: " +
        (error?.message ||
          "Nepoznata greška.")
    });
  }
}
