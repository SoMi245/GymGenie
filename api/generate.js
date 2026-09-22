export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
Ti si GymGenie, AI fitness i nutrition planner.

Napravi personalizovan sedmodnevni plan na osnovu ovih podataka:

Visina: ${height} cm
Težina: ${weight} kg
Godine: ${age}
Iskustvo: ${experience}
Cilj: ${goal}
Treninga sedmično: ${trainingDays}
Mjesto treninga: ${location}
Obroka dnevno: ${meals}

Plan mora sadržavati:
- svih 7 dana, od ponedjeljka do nedjelje
- za svaki dan trening ili odmor
- konkretne vježbe
- serije, ponavljanja i odmor
- obroke za taj dan
- približne kalorije i proteine
- preporuku za unos vode
- dane oporavka

Ako je korisnik početnik, nemoj davati nepotrebno komplikovane vježbe.
Ako trenira kod kuće ili bez opreme, koristi samo odgovarajuće vježbe.

Odgovor napiši na srpskom/bosanskom jeziku i neka bude jasan i praktičan.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "AI greška"
      });
    }

    return res.status(200).json({
      plan: data.output_text
    });

  } catch (error) {
    return res.status(500).json({
      error: "Greška servera."
    });
  }
}
