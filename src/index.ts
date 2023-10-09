import { Command } from "commander";
import fs from "fs";
import { chatCommand } from "./commands/chat";
import { deployCommand } from "./commands/deploy";

function main() {
  const program = new Command();

  program
    .command("chat")
    .description("Start the chat tool")
    .option("-c, --cwd <path>", "Working directory")
    .action(async ({ cwd }: { cwd: string }) => {
      if (!fs.existsSync(cwd)) throw `Invalid path: ${cwd}`;

      // Create sessions folder if it doesn't exist
      const sessionsFolder = `${cwd}/sessions`;
      if (!fs.existsSync(sessionsFolder)) {
        fs.mkdirSync(sessionsFolder, { recursive: true });
      }

      // Get absolute path for the working directory
      const absoluteCwd = fs.realpathSync(cwd);

      await chatCommand({
        apiKey: process.env.OPENAI_API_TOKEN!,
        cwd: absoluteCwd,
        onComplete: (messages) => {
          const content = JSON.stringify(messages, null, 2);
          fs.writeFileSync(`${sessionsFolder}/${Date.now()}.json`, content);
        },
      });
    });

  program
    .command("deploy")
    .description("Tune the OpenAI API parameters")
    .option("-c, --cwd <path>", "Working directory")
    .action(async ({ cwd }: { cwd: string }) => {
      if (!fs.existsSync(cwd)) throw `Invalid path: ${cwd}`;

      // Get absolute path for the working directory
      const absoluteCwd = fs.realpathSync(cwd);

      await deployCommand({
        apiKey: process.env.OPENAI_API_TOKEN!,
        cwd: absoluteCwd,
      });
    });

  program.parse(process.argv);
}

main();
