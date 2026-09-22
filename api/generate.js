module.exports = async function handler(req, res) {
  try {
    const token = process.env.CLOUDFLARE_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "Nema CLOUDFLARE_API_TOKEN."
      });
    }

    const response = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/a43fed266914fe3fc335395be49d2413/ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "@cf/zai-org/glm-4.7-flash",
          messages: [
            {
              role: "user",
              content: "Odgovori samo riječju OK."
            }
          ],
          chat_template_kwargs: {
            enable_thinking: false
          },
          max_completion_tokens: 20,
          temperature: 0
        })
      }
    );

    const text = await response.text();

    return res.status(200).json({
      httpStatus: response.status,
      cloudflareResponse: text
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Nepoznata greška"
    });
  }
};
