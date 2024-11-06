import express, { Request, Response } from "express";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";
import { fal } from "@fal-ai/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Configure fal client
fal.config({
  credentials: process.env.FAL_AI_KEY,
});

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

app.post("/api/generate", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  console.log("Received prompt:", prompt);

  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: {
          width: 200,
          height: 200,
        },
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(update.logs.map((log) => log.message));
        }
      },
    });

    if (!result.data.images?.[0]?.url) {
      throw new Error("No image URL in response");
    }

    console.log("Generated image data:", result.data);
    res.json({ imageUrl: result.data.images[0].url });
  } catch (error) {
    console.error("Failed to generate image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

app.post("/api/variations", async (req: Request, res: Response) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Generate 4 slight variations of this image prompt, maintaining the same general theme but with small changes. Original prompt: "${prompt}". Return only the 4 prompts, separated by "|" characters.`,
        },
      ],
    });

    const prompts =
      completion.data.choices[0].message?.content?.split("|") || [];
    const validPrompts = prompts.filter((p) => p.trim().length > 0).slice(0, 4);
    console.log("variations", validPrompts);

    // The split("|") is failing because GPT returned numbered list with newlines
    // instead of pipe-separated values. Let's handle both formats
    if (validPrompts.length === 1 && validPrompts[0].includes("\n")) {
      // Split by newlines and clean up numbered prefixes
      const newValidPrompts = validPrompts[0]
        .split("\n")
        .map((p) => p.replace(/^\d+\.\s*/, "").trim())
        .filter((p) => p.length > 0);
      validPrompts.splice(0, 1, ...newValidPrompts);
    }

    // Handle case where GPT returns a single string with numbered list
    if (
      validPrompts.length === 1 &&
      validPrompts[0].includes("Slightly variations:")
    ) {
      const lines = validPrompts[0]
        .split("\n")
        .filter((line) => line.match(/^\d+\./));
      const cleanedPrompts = lines.map((line) =>
        line.replace(/^\d+\.\s*"|"$/g, "").trim()
      );
      validPrompts.splice(0, 1, ...cleanedPrompts);
    }

    if (validPrompts.length < 4) {
      throw new Error("Did not receive 4 valid prompt variations");
    }

    const variations = await Promise.all(
      validPrompts.map(async (variationPrompt) => {
        const result = await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt: variationPrompt.trim(),
            image_size: {
              width: 200,
              height: 200,
            },
          },
          logs: true,
        });

        if (!result.data.images?.[0]?.url) {
          throw new Error("No image URL in response");
        }

        return {
          prompt: variationPrompt.trim(),
          imageUrl: result.data.images[0].url,
        };
      })
    );

    if (variations.length !== 4) {
      throw new Error("Did not generate 4 variations");
    }

    res.json({ variations });
  } catch (error) {
    console.error("Failed to generate variations:", error);
    res.status(500).json({ error: "Failed to generate variations" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
