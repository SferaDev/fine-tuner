import { OpenAIStream } from "ai";
import OpenAI from "openai";
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";
import type { ChatCompletionMessageParam } from "openai/resources/chat/index.mjs";
import { createInterface } from "readline";
import fs from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import z from "zod";

type StartOptions = {
  apiKey: string;
  cwd: string;
  model?: ChatCompletionCreateParamsBase["model"];
  onComplete: (messages: ChatCompletionMessageParam[]) => void;
};

type ToolFunction =
  OpenAI.Chat.Completions.ChatCompletionCreateParams.Function & {
    handler: (...args: any[]) => any;
    schema: z.Schema<any>;
  };

async function loadFunctions(cwd: string) {
  const files = fs.readdirSync(`${cwd}/functions`);
  const functionFiles = files.filter((file) => file.endsWith(".ts"));
  const functions: ToolFunction[] = [];

  for (const file of functionFiles) {
    const { handler, metadata, schema } = await import(
      `${cwd}/functions/${file}`
    );

    functions.push({
      name: metadata.name,
      description: metadata.description,
      parameters: zodToJsonSchema(schema),
      handler,
      schema,
    });
  }

  return functions;
}

export async function chatCommand(options: StartOptions) {
  const openai = new OpenAI({ apiKey: options.apiKey });
  const model = options.model ?? "gpt-3.5-turbo";
  const functions = await loadFunctions(options.cwd);

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
      model,
      stream: true,
      messages,
      functions,
    });

    const stream = OpenAIStream(response, {
      experimental_onFunctionCall: async (
        payload,
        createFunctionCallMessages
      ) => {
        console.log("onFunctionCall", payload);

        const { handler, schema } = functions.find(
          (fn) => fn.name === payload.name
        )!;

        const args = schema.parse(payload.arguments);
        const array = Array.isArray(args) ? args : [args];
        const result = await handler(...array);

        // Types don't match up here, so we have to cast
        const newMessages = createFunctionCallMessages(result) as any;
        messages.push(...newMessages);

        return openai.chat.completions.create({
          messages: [...messages, ...newMessages],
          stream: true,
          model,
          functions,
        });
      },
    });

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
