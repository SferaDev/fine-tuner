import { Command } from "commander";
import fs from "fs";
import { start } from "./tool";

function main() {
  const program = new Command();

  program.arguments("<path>").action(async (path: string) => {
    if (!pathIsValid(path)) throw `Invalid path: ${path}`;

    // Create sessions folder if it doesn't exist
    const sessionsFolder = `${path}/sessions`;
    if (!fs.existsSync(sessionsFolder)) {
      fs.mkdirSync(sessionsFolder, { recursive: true });
    }

    // Get absolute path for the working directory
    const cwd = fs.realpathSync(path);

    await start({
      apiKey: process.env.OPENAI_API_TOKEN!,
      cwd,
      onComplete: (messages) => {
        const content = JSON.stringify(messages, null, 2);
        fs.writeFileSync(`${sessionsFolder}/${Date.now()}.json`, content);
      },
    });
  });

  program.parse(process.argv);
}

function pathIsValid(path: string): boolean {
  return fs.existsSync(path);
}

main();
