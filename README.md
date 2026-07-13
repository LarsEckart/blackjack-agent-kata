# Blackjack Agent Kata

This repository is a coding exercise intended for use with coding agents. 

The goal is not to complete all instructions and GitHub issues, but rather to explore and observe the agent using skills and other tools to get work done beyond just generating code.
You're encouraged to revert changes, make modifications to AGENTS.md, SKILL.md and other instructions and re-do tasks to see if/what changes.


## What to do?

* Start frontend and backend and play a few games
* Invoke the improve-codebase-architecture skill and see what happens
* AGENTS.md and a skill mention "ast-grep outline", read more about it at https://astgrep.com/blog/ast-grep-outline.html
* Once you got results from the improve-codebase-architecture skill, review the html report. Do you agree and like the findings?
* The agents usually wnats to continue and start improving the codebase according to the findings. You probably don't want that. 
You could extract these proposals into a markdown file, to start a fresh session and only load the specific findings you want to tackle.
I've sort of done that for you, [issue #4](https://github.com/LarsEckart/blackjack-agent-kata/issues/4), is the outcome of me telling the agent "create a github issue for fixing the `Refactor Round rules into a transport-free, typed module` finding".
You now can tell the agent to "read [issue #4](https://github.com/LarsEckart/blackjack-agent-kata/issues/4) and refactor"
* The issue is quite detailed, your agent should refactor quite well. We don't spend too much time reviewing the changes due to time constraints, but in general, you should, and you probably also have minor follow-up suggestions for the agent.
* Rinse and repeat, tell your agent to read the issues for the backend bugs ([#3](https://github.com/LarsEckart/blackjack-agent-kata/issues/3), [#6](https://github.com/LarsEckart/blackjack-agent-kata/issues/6)) and fix them.
* Rinse and repeat, tell your agent to read the issues for the frontend bugs ([#1](https://github.com/LarsEckart/blackjack-agent-kata/issues/1), [#2](https://github.com/LarsEckart/blackjack-agent-kata/issues/2)) and fix them. Tell it to make use of the web-browser skill and actually play the game and take screenshots (or even a demo recording!) as proof of the work done, before and after.

## What then?

* Think about [#7](https://github.com/LarsEckart/blackjack-agent-kata/issues/7), we'll have a group discussion around it
* Implement [issue #8](https://github.com/LarsEckart/blackjack-agent-kata/issues/8), how well does the agent do?
* Ask for e2e tests, [issue #5](https://github.com/LarsEckart/blackjack-agent-kata/issues/5)


## Agent prerequisites

Some agent skills used with this kata expect these command-line tools to be
available:

- [GitHub CLI (`gh`)](https://github.com/cli/cli#installation), for skills that
  read or work with GitHub issues, pull requests, and repository metadata.
- [ast-grep (`ast-grep`)](https://astgrep.com/guide/quick-start), for skills
  that inspect code structure with commands such as `ast-grep outline`.
- [tmux](https://github.com/tmux/tmux), for skills that run and observe the
  blackjack backend and frontend together.
- [ffmpeg](https://ffmpeg.org/), for the macOS `recording-demo` screen-recording
  skill.

### macOS

Install the prerequisites with [Homebrew](https://brew.sh/):

```sh
brew install gh ast-grep tmux ffmpeg
```

The `recording-demo` skill also requires macOS Screen Recording permission for
the terminal or pi process. Microphone permission is needed only when a
recording explicitly includes audio.

Alternatively, install ast-grep with npm:

```sh
npm install --global @ast-grep/cli
```

### Windows

The `tmux` skill requires a Unix-like shell, so use
[WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) and run the agent
and repository commands from the WSL shell. Tmux is installed from Ubuntu's package repository. The GitHub CLI commands use its
[official Debian/Ubuntu package instructions](https://github.com/cli/cli/blob/trunk/docs/install_linux.md):

```sh
sudo apt update
sudo apt install -y tmux wget

sudo mkdir -p -m 755 /etc/apt/keyrings
out=$(mktemp)
wget -nv -O "$out" https://cli.github.com/packages/githubcli-archive-keyring.gpg
sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg < "$out" > /dev/null
rm "$out"
sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
sudo mkdir -p -m 755 /etc/apt/sources.list.d
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install -y gh

npm install --global @ast-grep/cli
```

If the agent runs natively in Windows instead of WSL, GitHub CLI's official
[WinGet](https://github.com/cli/cli/blob/trunk/docs/install_windows.md) command
is:

```powershell
winget install --id GitHub.cli --source winget
```

Install `gh` inside WSL when the agent runs there.

After installing GitHub CLI, run `gh auth login` if an agent skill needs access
to GitHub data.

## Run locally

Start the backend in one terminal:

```sh
cd backend
./gradlew :app:run
```

The backend listens on `http://localhost:8080`.

In a second terminal, install the frontend dependencies on the first run and
start the Vite development server:

```sh
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173` in a browser. Stop either process with `Ctrl-C`.

## What to look out for

Does the agent invoke the skills. Does it make mistakes with any of the commands?


## Credits

### Skills

improve-codebase-architecture by Matt Pocock ([https://www.aihero.dev/])

codebase-design by Matt Pocock

web-browser by Mario Zechner ([https://mariozechner.at/])
