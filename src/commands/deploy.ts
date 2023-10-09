import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";
import fs from "fs";
import OpenAI from "openai";

type DeployOptions = {
  apiKey: string;
  cwd: string;
  model?: ChatCompletionCreateParamsBase["model"];
};

export async function deployCommand(options: DeployOptions) {
  const files = fs.readdirSync(`${options.cwd}/sessions`);

  const sessions = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const messages = JSON.parse(
        fs.readFileSync(`${options.cwd}/sessions/${file}`, "utf8")
      );

      return JSON.stringify({ messages });
    });

  if (sessions.length === 0) {
    throw "No sessions found";
  }

  if (sessions.length < 10) {
    throw "Not enough sessions found, please chat for at least 10 sessions";
  }

  const openai = new OpenAI({ apiKey: options.apiKey });

  const { id } = await openai.files.create({
    file: new File([sessions.join("\n")], "sessions.jsonl"),
    purpose: "fine-tune",
  });

  await openai.fineTuning.jobs.create({
    model: "gpt-3.5-turbo",
    training_file: id,
  });

  console.log(`Created fine-tuning job with id: ${id}`);
}
