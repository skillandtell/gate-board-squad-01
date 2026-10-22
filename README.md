# 🛰 Gate Board · Hunter Association

The live board of every active **Gate** in Algiers and the **hunters** who protect them.

**👉 Your mission is in [MISSION.md](MISSION.md). Read it first.**

| | |
|---|---|
| 🌐 Live board | the link in the **About** box → reads `main` live, updates within a minute of a merge |
| 📋 Tasks | the **Issues** tab (#1 to #4… and maybe more) |
| 🚀 Deployments | the **Actions** tab (GitHub Pages copy, optional) |

## Project structure

```
index.html  style.css  app.js     the board itself — don't touch
hunters/hunter-1.json … -4.json   one card per hunter          (Issue #1)
data/gates.json                   the list of active Gates     (Issue #2)
config/settings.json              board settings               (Issue #3)
data/guild.json                   your guild name and motto    (Issue #4)
.github/workflows/deploy.yml      publishes the board on GitHub Pages
```

## Team rules

1. `main` is protected — every change goes through a **pull request** with **1 approval**.
2. One task = one branch = one pull request. Branch names: `hunter-N/what-you-do`.
3. Commit messages say **what** and **why**: `Add Salah's hunter card (closes #1)`.
4. Never edit another hunter's file. Never merge your own PR.
5. `git pull origin main` before you start anything new.

## Run it locally

Open the folder in VS Code → right-click `index.html` → **Open with Live Server**.
