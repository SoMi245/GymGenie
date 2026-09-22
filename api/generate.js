module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Koristi POST zahtjev." });
  }

  try {
    const body = req.body || {};

    const height = Number(body.height);
    const weight = Number(body.weight);
    const age = Number(body.age);
    const trainingDays = Number(body.trainingDays);
    const meals = Number(body.meals);

    const experience = body.experience || "";
    const goal = body.goal || "";
    const location = body.location || "";

    if (
      !Number.isFinite(height) ||
      !Number.isFinite(weight) ||
      !Number.isFinite(age) ||
      !Number.isFinite(trainingDays) ||
      !Number.isFinite(meals)
    ) {
      return res.status(400).json({
        error: "Provjeri unesene podatke."
      });
    }

    const bmi = weight / Math.pow(height / 100, 2);

    let calories = Math.round(weight * 30);

    if (age >= 18) {
      if (goal === "Mršavljenje") calories = Math.max(1800, calories - 250);
      if (goal === "Dobijanje mišićne mase") calories += 250;
    }

    const protein = Math.round(weight * 1.6);
    const water = Math.round(weight * 0.035 * 10) / 10;

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
      5: ["PONEDJELJAK", "UTORAK", "ČETVRTAK", "PETAK", "SUBOTA"],
      6: ["PONEDJELJAK", "UTORAK", "SRIJEDA", "ČETVRTAK", "PETAK", "SUBOTA"],
      7: days
    };

    const trainingSchedule =
      schedules[trainingDays] || schedules[3];

    const homeNoEquipment = [
      ["Sklekovi", 3, "8-12", "60 sekundi"],
      ["Čučanj", 3, "12-15", "60 sekundi"],
      ["Iskorak", 3, "10-12 po nozi", "60 sekundi"],
      ["Plank", 3, "30-45 sekundi", "45 sekundi"]
    ];

    const homeEquipment = [
      ["Goblet čučanj", 3, "10-12", "90 sekundi"],
      ["Veslanje sa bučicom", 3, "10-12", "90 sekundi"],
      ["Potisak bučicama", 3, "8-12", "90 sekundi"],
      ["Rumunsko mrtvo dizanje sa bučicama", 3, "10-12", "90 sekundi"]
    ];

    const gym = [
      ["Bench press", 3, "8-12", "90 sekundi"],
      ["Lat pulldown", 3, "8-12", "90 sekundi"],
      ["Čučanj sa šipkom", 3, "8-10", "120 sekundi"],
      ["Shoulder press", 3, "8-12", "90 sekundi"]
    ];

    let exerciseSet = gym;

    if (location === "Kuća - bez opreme") {
      exerciseSet = homeNoEquipment;
    } else if (location === "Kuća - osnovna oprema") {
      exerciseSet = homeEquipment;
    }

    const mealPool = [
      ["Doručak", "Jaja, integralni hljeb i jogurt"],
      ["Ručak", "Piletina, riža i salata"],
      ["Užina", "Grčki jogurt, banana i orašasti plodovi"],
      ["Večera", "Tunjevina, krompir i povrće"],
      ["Obrok", "Zobene pahuljice, mlijeko i voće"],
      ["Obrok", "Posni sir, hljeb i povrće"]
    ];

    const planDays = days.map(function(day) {
      const isTraining = trainingSchedule.includes(day);

      const exercises = isTraining
        ? exerciseSet.map(function(item) {
            return {
              name: item[0],
              sets: item[1],
              reps: item[2],
              rest: item[3]
            };
          })
        : [];

      const dayMeals = [];

      for (let i = 0; i < meals; i++) {
        const meal = mealPool[i % mealPool.length];

        dayMeals.push({
          name: meal[0],
          description: meal[1]
        });
      }

      return {
        day: day,
        type: isTraining ? "TRENING" : "ODMOR",
        exercises: exercises,
        meals: dayMeals,
        calories: calories,
        protein: protein,
        water: water
      };
    });

    const plan = {
      days: planDays
    };

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
    console.error("GYMGENIE ERROR:", error);

    return res.status(500).json({
      error: error && error.message
        ? error.message
        : "Greška servera."
    });
  }
};
