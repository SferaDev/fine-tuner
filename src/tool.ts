import { OpenAIStream } from "ai";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/index.mjs";
import { createInterface } from "readline";

type StartOptions = {
  projectPath: string;
  apiToken: string;
};

export async function start(options: StartOptions) {
  const openai = new OpenAI({ apiKey: options.apiToken });

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

  const model = "gpt-4";
  const messages: ChatCompletionMessageParam[] = [];

  while (true) {
    const content = await prompt("> ");
    messages.push({ role: "user", content });

    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages,
    });

    const stream = OpenAIStream(response);

    for await (const value of stream) {
      const message = new TextDecoder().decode(value);
      readline.write(message);
    }

    readline.write("\n");
  }
}
