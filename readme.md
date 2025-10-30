# Git Commit GPT

> ✨ A VS Code extension that automatically generates clear, human‑readable, and context‑aware Git commit messages using OpenAI (ChatGPT).

---

## Features

✅ Analyzes your **staged changes (`git diff --cached`)**  
✅ Generates **human and factual commit messages**  
✅ Lets you **preview and edit** before committing  
✅ Runs `git add -A` and commits directly from VS Code  
✅ Optional **push after commit**  
✅ Supports English 🇬🇧 and Swedish 🇸🇪  
✅ Configurable styles: `concise`, `detailed`, `conventional`

---

## Installation

### 1️⃣ Clone and install dependencies

```bash
git clone https://github.com/danielruuth/git-commit-gpt.git
cd git-commit-gpt
npm install
```

### 2️⃣ Build and package

```bash
npx tsc
npx vsce package
```

This will create a `.vsix` file, for example:

```
git-commit-gpt-0.2.0.vsix
```

### 3️⃣ Install in VS Code

Open VS Code → Extensions (⇧⌘X / Ctrl+Shift+X)  
Click **⋯ → Install from VSIX…**  
Select the `.vsix` file you just built.

Or install via terminal:

```bash
code --install-extension git-commit-gpt-0.2.0.vsix
```

---

## 🔑 OpenAI API Key

The extension uses OpenAI’s API to generate commit messages.  
You need a valid **API key**.

### Option A – Environment variable (recommended)

macOS/Linux:

```bash
export OPENAI_API_KEY="your-secret-key"
```

Windows PowerShell:

```powershell
setx OPENAI_API_KEY "your-secret-key"
```

### Option B – VS Code Settings

Go to **Settings → Extensions → Git Commit GPT**  
and set `gitCommitGPT.openaiApiKey`.

---

## 🧩 Usage

Once installed:

1. Open a Git repository in VS Code  
2. Run command:  
   ```
   Ctrl/Cmd + Shift + P → Commit GPT: Stage All → Preview → Commit
   ```
3. Wait while GPT analyzes your staged changes  
4. A preview box opens – edit if needed  
5. Press **Enter** to commit  
6. Optionally push the changes

---

## ⚙️ Settings

| Setting | Default | Description |
|----------|----------|-------------|
| `gitCommitGPT.openaiApiKey` | *(empty)* | Your OpenAI key (or use `OPENAI_API_KEY`) |
| `gitCommitGPT.model` | `gpt-4.1-mini` | Model used for message generation |
| `gitCommitGPT.language` | `sv` | Message language (`sv` or `en`) |
| `gitCommitGPT.commitStyle` | `concise` | `concise`, `detailed`, or `conventional` |
| `gitCommitGPT.maxDiffChars` | `20000` | Max characters sent in diff prompt |

---

## 🧠 Example

**Prompt (diff extract):**

```diff
- const apiUrl = '/old-endpoint'
+ const apiUrl = '/new-endpoint'
```

**Generated commit message:**  
> 🔧 Update API endpoint to new path for improved stability

---

## 🛠️ Build & Develop

```bash
npm run build      # compile TypeScript → out/
npm run package    # create .vsix file
```

To debug, press `F5` in VS Code → opens “Extension Development Host”.

---

## 🧾 License

MIT © [Daniel Ruuth](https://github.com/danielruuth)

---

## 🤝 Contributing

Pull requests are welcome!  
If you find a bug or want to suggest a feature, please open an issue.

---

## 🌟 Future Ideas

- [ ] Multiple commit message suggestions (Quick Pick)  
- [ ] Conventional Commit prefix detection by file type  
- [ ] Team model (learns from previous commits)  
- [ ] Pre‑commit Git hook integration  
