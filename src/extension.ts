import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { makeOpenAIClient, generateCommitMessage } from "./openai";

type GitAPI = {
  repositories: Array<{
    rootUri: vscode.Uri;
  }>;
};

export function activate(context: vscode.ExtensionContext) {
  const stageAndCommit = vscode.commands.registerCommand(
    "git-commit-gpt.stageAndCommit",
    async () => {
      try {
        await ensureWorkspace();
        const { repoPath, repoName } = await getRepoPathAndName();

        // 1) Stage all
        await execAsync("git add -A", { cwd: repoPath });

        // 2) Hämta staged filer
        const stagedFiles = await getStagedFiles(repoPath);
        if (stagedFiles.length === 0) {
          vscode.window.showInformationMessage("Inga staged ändringar att committa.");
          return;
        }

        // 3) Skapa diff på staged ändringar (mot HEAD)
        const cfg = vscode.workspace.getConfiguration("gitCommitGPT");
        const maxDiffChars = cfg.get<number>("maxDiffChars", 20000);
        const diff = await getUnifiedCachedDiff(repoPath, stagedFiles, maxDiffChars);

        // 4) Generera commit-meddelande med GPT
        const apiKey = cfg.get<string>("openaiApiKey") || "";
        const model = cfg.get<string>("model", "gpt-4.1-mini");
        const language = (cfg.get<string>("language", "sv") as "sv" | "en");
        const style = (cfg.get<string>("commitStyle", "concise") as "concise" | "detailed" | "conventional");

        const client = makeOpenAIClient(apiKey || undefined);
        const message = await generateCommitMessage({
          client,
          model,
          language,
          style,
          repoName,
          fileList: stagedFiles,
          diff
        });

        // 5) Förhandsvisning (ersätt 'title' med 'prompt' för kompatibilitet)
        const finalMessage = await vscode.window.showInputBox({
          prompt: "Commit GPT: Förhandsvisa & redigera commit-meddelande",
          value: message,
          placeHolder: "Redigera om du vill. Enter för att committa. Esc för att avbryta.",
          validateInput: (text) => (text.trim().length ? null : "Commit-meddelandet kan inte vara tomt.")
        });

        if (!finalMessage) {
          vscode.window.showInformationMessage("Commit avbruten.");
          return;
        }

        // 6) Commit
        await execAsync(`git commit -m ${shellQuote(finalMessage)}`, { cwd: repoPath });

        vscode.window.showInformationMessage("Commit skapad ✅");

        // Valfritt: fråga om push
        const pushChoice = await vscode.window.showQuickPick(
          ["Push nu", "Gör inget"],
          { placeHolder: "Vill du pusha ändringarna?" }
        );

        if (pushChoice === "Push nu") {
          await execAsync("git push", { cwd: repoPath });
          vscode.window.showInformationMessage("Push klar ⬆️");
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Commit GPT: ${err?.message ?? String(err)}`);
      }
    }
  );

  context.subscriptions.push(stageAndCommit);
}

export function deactivate() {
  // noop
}

async function ensureWorkspace() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error("Öppna en arbetsyta med ett Git-repo.");
}

async function getRepoPathAndName() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error("Ingen arbetsyta.");
  const repoPath = folder.uri.fsPath;
  const repoName = path.basename(repoPath);
  await execAsync("git rev-parse --is-inside-work-tree", { cwd: repoPath });
  return { repoPath, repoName };
}

async function getStagedFiles(repoPath: string): Promise<string[]> {
  const { stdout } = await execAsync("git diff --cached --name-only", { cwd: repoPath });
  return stdout.split("\n").map(s => s.trim()).filter(Boolean);
}

async function getUnifiedCachedDiff(repoPath: string, files: string[], maxChars: number): Promise<string> {
  const chunks: string[] = [];
  const batchSize = 80;
  for (let i = 0; i < files.length; i += batchSize) {
    const slice = files.slice(i, i + batchSize).map(f => `"${f.replace(/"/g, '\\"')}"`).join(" ");
    const cmd = `git diff --cached --no-ext-diff --unified=0 -- ${slice}`;
    const { stdout } = await execAsync(cmd, { cwd: repoPath, maxBuffer: 1024 * 1024 * 20 });
    chunks.push(stdout);
    if (chunks.join("\n").length > maxChars) break;
  }
  let diff = chunks.join("\n");
  if (diff.length > maxChars) diff = diff.slice(0, maxChars) + "\n…[diff truncerad]";
  return diff || "Inga diff-rader (kan vara binära filer eller endast metadata).";
}

/**
 * Kör ett shell-kommando och returnerar stdout/stderr som UTF-8-strängar.
 * Fixar typerna (Node 20+ kan ge Buffer/NonSharedBuffer).
 */
function execAsync(
  command: string,
  opts: cp.ExecOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    cp.exec(
      command,
      { ...opts, encoding: "utf8" }, // garanterar string I/O
      (err: cp.ExecException | null, stdout: string, stderr: string) => {
        if (err) {
          reject(new Error(stderr || err.message || "Okänt fel"));
        } else {
          resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        }
      }
    );
  });
}

/** En enkel citat-funktion för git commit -m */
function shellQuote(msg: string): string {
  // Använd single quotes och escapa single quotes inuti
  const safe = msg.replace(/'/g, `'\\''`);
  return `'${safe}'`;
}
