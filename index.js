import { addOption, addBlankOption, removeChild } from './util.js';

const selectNames = ["goalie", "lw", "c", "rw", "ld", "rd", "missing"];
const forwardNames = ["lw", "rw", "c"];
const defenseNames = ["ld", "rd"];

const selects = [];
var playerOptions = [];
var page = 0;
var edited = true;
const pages = ["edit-page", "display-page", "loading-page"].map(p => document.getElementById(p));
const roster = document.getElementById("roster");
const nav = document.getElementsByTagName("nav")[0];

selectNames.forEach(name => {
    const cont = document.getElementById(name);
    const sels = cont.querySelectorAll("select");
    sels.forEach((s, i) => {
        s.dataset.i = i;
        if (sels.length === 1) {
            s.id = cont.id + "-select";
            cont.querySelector("label").setAttribute("for", s.id);
        }
        else
            s.ariaLabel = cont.title + " " + (i + 1);
        s.addEventListener("change", change);
        selects.push(s);
    });
});

for (let i = 0; i < nav.children.length; i++) {
    nav.children[i].onclick = e => {
        if (!(e instanceof PopStateEvent))
            history.pushState(i, "Bug 223190");

        // switch page
        nav.children[page].disabled = false;
        nav.children[i].disabled = true;

        showPage(i);
        switch (page) {
            case 1:
                display();
                break;
        }
    };
}

window.addEventListener("popstate", ev => nav.children[ev.state ?? 0].onclick(ev));

showPage(0);
loadData();

document.getElementById("add-btn").addEventListener('click', addPlayerClick);
document.getElementById("remove-btn").addEventListener('click', removePlayerClick);
document.getElementById("reset-btn").addEventListener('click', () => { reset(); clearPos(); });
document.getElementById("remove-all-btn").addEventListener('click', removeAll);
document.getElementById("import-input").addEventListener('change', importPlayersFile);
document.getElementById("export-btn").addEventListener('click', exportPlayersFile);

function showPage(newPage) {
    pages[page].style.display = "none";
    pages[newPage].style.display = "unset";
    page = newPage;
}

function getSelectId(s) {
    return s.parentElement.id + s.dataset.i;
}

function change(event) {
    const val = event.target.value;
    const old = event.target.name;
    event.target.name = val;

    if (old !== "") addPlayer(old, event.target);
    if (val !== "") removePlayer(val);
    localStorage.setItem(getSelectId(event.target), val);
    edited = true;
}

function addPlayerClick() {
    let player = prompt("Enter player to add:");
    if (player && (player = player.trim())) {
        const players = localStorage.getItem("players");
        if (players) {
            localStorage.setItem("players", players + "\n" + player);
            addPlayer(player);
        }
        else {
            localStorage.setItem("players", player);
            reset();
        }
    }
}

function removePlayerClick() {
    let player = prompt("Enter player to remove:");
    if (player && (player = player.trim())) {
        let players = localStorage.getItem("players");
        if (players) {
            const newPlayers = players.split("\n").filter(p => p !== player);
            if (newPlayers.length) {
                localStorage.setItem("players", newPlayers.join("\n"));
            }
            else {
                localStorage.removeItem("players");
            }
        }
        removePlayer(player, false);
    }
}

function removeAll() {
    localStorage.removeItem("players");
    reset();
    clearPos();
}

function addPlayer(player, skip) {
    playerOptions.push(player);
    selects.forEach(i => {
        if (i.name !== player && i !== skip)
            addOption(i, player);
    });
    roster.append("\n" + player);
}

function removePlayer(player, skip = true) {
    playerOptions = playerOptions.filter(v => v !== player);
    selects.forEach(i => {
        if (!skip || i.name !== player)
            removeChild(i, player);
        if (!skip) {
            i.name = "";
            localStorage.removeItem(getSelectId(i));
        }
    });
    roster.textContent = roster.textContent.split("\n").filter(p => p !== player).join("\n");
}

function display() {
    if (!edited) return;
    edited = false;
    const forwardOutputs = Array.from(document.querySelectorAll("#o-forwards span"));
    forwardNames.forEach((p, i) =>
        forwardOutputs[i].textContent = Array.from(document.querySelectorAll(`#${p} select`)).map(s => s.value).filter(v => v !== '').join("\n")
    );

    const defenseOutputs = Array.from(document.querySelectorAll("#o-defense span"));
    defenseNames.forEach((p, i) =>
        defenseOutputs[i].textContent = Array.from(document.querySelectorAll(`#${p} select`)).map(s => s.value).filter(v => v !== '').join("\n")
    );

    document.querySelector("#o-goalie span").textContent = document.querySelector(`#goalie select`).value;
}

function importPlayersFile(e) {
    const file = e.target.files[0];
    if (file.size > 1_000) {
        console.log("File too large");
        return;
    }

    var fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
        var file = fileLoadedEvent.target.result;
        if (!file) return;
        const playersTxt = file.replaceAll("\r", "");
        const players = playersTxt.split("\n").map(p => p.trim());
        importPlayers(players);
    };

    fileReader.readAsText(file, "UTF-8");
}

function importPlayers(players) {
    localStorage.setItem("players", players.join("\n"));

    reset();
    clearPos();
}

function exportPlayersFile() {
    const players = localStorage.getItem("players");
    const a = document.getElementById("export-input");
    a.setAttribute("href", "data:text;charset=utf-8," + encodeURIComponent(players));
    a.click();
    a.removeAttribute("href");
}

function loadData() {
    reset();

    selects.forEach(s => {
        const player = localStorage.getItem(getSelectId(s));
        if (!player) return;
        s.value = player;
        s.name = player;
        removePlayer(player);
    });
}

function reset() {
    const playersStoreRaw = localStorage.getItem("players");
    playerOptions = playersStoreRaw ? playersStoreRaw.split("\n") : [];
    selects.forEach(i => i.textContent = '');
    roster.textContent = playerOptions.join("\n");

    if (playerOptions.length)
        selects.forEach(i => {
            i.name = "";
            addBlankOption(i);
            playerOptions.forEach(p => addOption(i, p));
        });
}

function clearPos() {
    selects.forEach(s => localStorage.removeItem(getSelectId(s)));
}