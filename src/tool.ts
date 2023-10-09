import { OpenAIStream } from "ai";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";
import type { ChatCompletionMessageParam } from "openai/resources/chat/index.mjs";
import { createInterface } from "readline";

type StartOptions = {
  apiKey: string;
  model?: ChatCompletionCreateParamsBase["model"];
  onComplete: (messages: ChatCompletionMessageParam[]) => void;
};

export async function start(options: StartOptions) {
  const openai = new OpenAI({ apiKey: options.apiKey });

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = async (question: string): Promise<string> => {
    return new Promise((resolve) => {
      readline.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  const messages: ChatCompletionMessageParam[] = [];

  readline.on("SIGINT", () => {
    options.onComplete(messages);
    process.exit(0);
  });

  while (true) {
    const content = await prompt("> ");
    messages.push({ role: "user", content });

    const response = await openai.chat.completions.create({
      model: options.model ?? "gpt-3.5-turbo",
      stream: true,
      messages,
    });

    const stream = OpenAIStream(response);

    let message = "";

    for await (const value of stream) {
      const part = new TextDecoder().decode(value);
      readline.write(part);
      message += part;
    }

    messages.push({ role: "assistant", content: message });

    readline.write("\n");
  }
}
