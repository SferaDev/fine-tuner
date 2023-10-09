import { Command } from "commander";
import fs from "fs";
import { start } from "./tool";

function main() {
  const program = new Command();

  program.arguments("<path>").action(async (path: string) => {
    if (!pathIsValid(path)) throw `Invalid path: ${path}`;

    await start({
      apiKey: process.env.OPENAI_API_TOKEN!,
      onComplete: (messages) => {
        const content = JSON.stringify(messages, null, 2);
        fs.writeFileSync(`${path}/messages.json`, content);
      },
    });
  });

  program.parse(process.argv);
}

function pathIsValid(path: string): boolean {
  // Check if the path exists and is valid
  // Return true if it is, false otherwise
  return fs.existsSync(path);
}

main();
