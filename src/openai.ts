import OpenAI from "openai";

export function makeOpenAIClient(apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Ingen OpenAI-nyckel hittades. Sätt `gitCommitGPT.openaiApiKey` i inställningar eller exportera miljövariabeln OPENAI_API_KEY."
    );
  }
  return new OpenAI({ apiKey: key });
}

export async function generateCommitMessage(opts: {
  client: OpenAI;
  model: string;
  language: "sv" | "en";
  style: "concise" | "detailed" | "conventional";
  repoName?: string;
  fileList: string[];
  diff: string;
}) {
  const { client, model, language, style, repoName, fileList, diff } = opts;

  const styleHint =
    style === "conventional"
      ? (language === "sv"
          ? "Använd Conventional Commits (feat:, fix:, refactor:, docs:, chore:, test:, perf:, build:, ci:) och skriv en kort sammanfattning + ev. punktlista."
          : "Use Conventional Commits (feat:, fix:, refactor:, docs:, chore:, test:, perf:, build:, ci:) with a short summary + optional bullet list.")
      : style === "detailed"
      ? (language === "sv"
          ? "Var tydlig och saklig, med en kort rubrik och 2–6 punkter som förklarar *varför* ändringen gjordes och *hur* den påverkar systemet."
          : "Be clear and factual, with a short title and 2–6 bullets explaining *why* the change was made and *how* it impacts the system.")
      : (language === "sv"
          ? "Skriv en kort rubrik (max ~70 tecken) och 1–3 korta rader som förklarar ändringen på ett mänskligt men sakligt sätt."
          : "Write a short title (~70 chars) and 1–3 short lines explaining the change in a human but factual way.");

  const langHint =
    language === "sv"
      ? "Svara på **svenska**."
      : "Respond in **English**.";

  const filesText = fileList.length ? fileList.slice(0, 30).join(", ") : "okända filer";

  const system = `
Du är en erfaren utvecklare som skriver utmärkta git commit-meddelanden.
Meddelandet ska vara lättläst för människor, korrekt, och fokusera på *varför* + *vad*.
Undvik intern jargong, stacktraces och brus.
${langHint}
`.trim();

  const user = `
Repository: ${repoName ?? "okänt repo"}
Berörda filer: ${filesText}

Stil: ${style}
Riktlinjer: ${styleHint}

Nedan följer en *kompakt* git diff (Unified, U=0). Skapa ett passande commit-meddelande.

--- BEGIN DIFF ---
${diff}
--- END DIFF ---
`.trim();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Kunde inte generera commit-meddelande.");
  return text;
}
