# MISSION 001 · FIRST CONTACT — The Gate Board

> **You just joined a real dev team.** The Hunter Association's **Gate Board** — the public page that
> shows every active Gate in Algiers and the hunters who protect it — **goes live tonight.**
> The code is written. The lead dev left before finishing it and opened **4 issues** on GitHub.
> Your squad has **30 minutes** to close them — the way every software team in the world works:
> **branch → commit → push → pull request → review → merge.**
>
> Every merge into `main` shows up on your squad's **live board** within a minute.
> When the board is complete, it reveals the Association's message and a **Clearance Seal**.
> First squad to submit the seal on the mission platform wins.

---

## 1 · Your squad

The mission platform gives every hunter a number. That number is your role.

| Role | Your issues |
|---|---|
| **Hunter 1 · Guild Master** | Issue **#1** (your card) + Issue **#4** Name your guild |
| **Hunter 2 · Engineer** | Issue **#1** (your card) + Issue **#2** Repair the Gate Board |
| **Hunter 3 · Operator** | Issue **#1** (your card) + Issue **#3** Switch on the alert system |
| **Hunter 4 · Responder** | Issue **#1** (your card) + **chief reviewer** + the issue that is still classified… |

Squad of 3? Hunter 1 is also the Responder.

## 2 · The issues (also in the **Issues** tab on GitHub)

| # | Issue | File to change | Done when the live board shows… |
|---|---|---|---|
| **1** | **Register the hunters** — every hunter adds their own card | `hunters/hunter-N.json` (one per hunter) | at least 3 valid cards, avatars visible |
| **2** | **Repair the Gate Board** — the board is down, "invalid JSON" | `data/gates.json` | the 6 Gates listed |
| **3** | **Switch on the alert system** — S and A-rank Gates must be monitored | `config/settings.json` | `● ALERT SYSTEM ONLINE` + the orange ticker |
| **4** | **Name your guild** — the board still says UNNAMED GUILD | `data/guild.json` | your guild name and motto in the header |
| **5** | 🔒 *Classified.* Keep your `main` up to date. | — | — |

You **never** edit `index.html`, `app.js` or `style.css`. Every task is a small change in **one JSON file** —
the hard part is not the code, it's **shipping it as a team without breaking anything.**

## 3 · How every task is shipped (the only workflow allowed)

`main` is **protected**: nobody can push to it directly. Everything goes through a pull request.

```bash
# once — get the project
git clone https://github.com/<org>/<your-squad-repo>.git
cd <your-squad-repo>

# for EVERY task
git checkout main
git pull origin main                      # start from the latest version
git checkout -b hunter-2/repair-board     # your own branch:  <who>/<what>
#   … edit the ONE file of your task, save …
git status                                # see what changed
git add data/gates.json
git commit -m "Fix missing comma in gates.json (closes #2)"
git push origin hunter-2/repair-board
```

Then on **GitHub**:

1. **Compare & pull request** → title + a sentence: *what* you changed and *why*. Write `Closes #2` in the description.
2. Ask a squadmate to **review** it (Files changed → Review changes → **Approve**).
3. The **reviewer merges** it — never merge your own PR.
4. Wait about a minute, then refresh the **live board** (link in the repo's About box).

> **Golden rule:** one task = one branch = one pull request. Pull before you branch.

## 4 · Where to see the result

- **Live board:** the link in your repo's **About** box (right side of the GitHub page) — `missions.skillntell.com/gate-board/…?repo=<org>/<your-squad-repo>`
- **Local preview:** open the folder in VS Code → right-click `index.html` → **Open with Live Server**.
  Locally you can check your JSON — but fragments only appear on the **live** board.

## 5 · Mission Control & scoring

The bottom panel of the board, **Mission Control**, lights up one row per closed issue and reveals a **fragment**
of the Association's message. Submit each fragment on the mission platform (Mission tab) as soon as it appears:
the scoreboard moves live.

When every row is green, the board shows the full message and the **CLEARANCE SEAL** → submit it.
**First squad to submit the Clearance Seal wins.** Then submit your live board URL — it goes on the big screen.

## 6 · When something goes wrong (it will — that's the point)

| You see | Do this |
|---|---|
| `Please tell me who you are` | `git config --global user.name "Your Name"` and `git config --global user.email "you@mail.com"` |
| `protected branch hook declined` | You pushed to `main`. Create a branch: `git checkout -b hunter-N/task`, then `git push origin hunter-N/task` |
| `rejected … fetch first` / `non-fast-forward` | `git pull origin <your-branch>` then push again |
| Vim opened (weird screen) | You forgot `-m`. Type `:wq` and press Enter |
| Push asks for a password | Sign in through the browser window, or ask a mentor for a token |
| Live board doesn't change | Is the PR **merged** into `main`? Wait 1 min, refresh |
| A card shows ⚠ | Read the message on the card — it tells you which field is wrong |

Raise your hand anytime. Mentors give **hints**, never answers.
