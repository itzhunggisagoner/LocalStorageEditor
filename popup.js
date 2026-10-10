const inExtension = typeof chrome !== "undefined" && Boolean(chrome.scripting);

const bandStops = ["#f5d590", "#f0a97a", "#e88d80", "#d2678a", "#a95390", "#6e4896"];

let items = {};
let editingKey = null;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function storageOp(action, key, value, oldKey) {
  try {
    const ls = window.localStorage;

    if (action === "read") {
      const data = {};
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        data[k] = ls.getItem(k);
      }
      return { ok: true, origin: location.origin, data };
    }

    if (action === "save") {
      ls.setItem(key, value);
      if (oldKey && oldKey !== key) ls.removeItem(oldKey);
    } else if (action === "remove") {
      ls.removeItem(key);
    } else if (action === "clear") {
      ls.clear();
    }

    return { ok: true };
  } catch (err) {
    const full = err.name === "QuotaExceededError";
    return { ok: false, error: full ? "Storage is full for this site." : err.message };
  }
}

async function run(...args) {
  let result;

  if (inExtension) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("There's no active tab.");

    const [injected] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: storageOp,
      args
    });
    result = injected?.result;
  } else {
    result = storageOp(...args);
  }

  if (!result) throw new Error("Chrome won't let extensions touch this page.");
  if (!result.ok) throw new Error(result.error);
  return result;
}

function showToast(message, good = false) {
  const box = $("toast");
  box.textContent = message;
  box.style.borderLeftColor = good ? "var(--sand)" : "var(--danger)";
  box.classList.remove("hidden");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.add("hidden"), 2600);
}

function bandColor(i, total) {
  if (total < 2) return bandStops[0];

  const pos = (i / (total - 1)) * (bandStops.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, bandStops.length - 1);
  const t = pos - lo;

  const a = bandStops[lo].match(/\w\w/g).map((h) => parseInt(h, 16));
  const b = bandStops[hi].match(/\w\w/g).map((h) => parseInt(h, 16));

  return `rgb(${a.map((v, n) => Math.round(v + (b[n] - v) * t)).join(",")})`;
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function iconButton(className, label, icon) {
  const btn = make("button", className);
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.innerHTML = `<svg class="icon"><use href="#i-${icon}"/></svg>`;
  return btn;
}

function openModal(key = "", value = "") {
  editingKey = key || null;

  $("modal-title").textContent = editingKey ? "Edit item" : "Add item";
  $("key").value = key;
  $("value").value = value;

  $("modal").classList.remove("hidden");
  (editingKey ? $("value") : $("key")).focus();
}

function closeModal() {
  $("modal").classList.add("hidden");
  editingKey = null;
}

function setCount(n) {
  $("count").textContent = `${n} item${n === 1 ? "" : "s"}`;
}

function showEmpty(title, hint) {
  const box = make("div", "empty");
  box.append(make("strong", "", title), hint);
  $("storage").replaceChildren(box);
}

function render() {
  const term = $("search").value.trim().toLowerCase();
  const all = Object.entries(items);
  const shown = all.filter(([k, v]) => {
    return k.toLowerCase().includes(term) || v.toLowerCase().includes(term);
  });

  setCount(all.length);

  if (!all.length) {
    showEmpty("Nothing stored here", "This site hasn't saved anything to localStorage yet. Hit Add to create the first key.");
    return;
  }

  if (!shown.length) {
    showEmpty("No matches", `Nothing has "${$("search").value.trim()}" in its key or value.`);
    return;
  }

  const rows = shown.map(([key, value], i) => {
    const row = make("div", "item");
    row.style.setProperty("--band", bandColor(i, shown.length));

    const keyEl = make("div", "key", key);
    keyEl.title = key;

    const valueEl = make("div", value ? "value" : "value blank", value || "empty string");
    if (value) valueEl.title = value;

    const edit = iconButton("action", "Edit", "edit");
    edit.addEventListener("click", () => openModal(key, value));

    const copy = iconButton("action", "Copy value", "copy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(value);
        showToast("Value copied.", true);
      } catch {
        showToast("Couldn't reach the clipboard.");
      }
    });

    const remove = iconButton("action delete", "Delete", "trash");
    remove.addEventListener("click", async () => {
      try {
        await run("remove", key);
        await load();
      } catch (err) {
        showToast(err.message);
      }
    });

    const actions = make("div", "actions");
    actions.append(edit, copy, remove);

    row.append(keyEl, valueEl, actions);
    return row;
  });

  $("storage").replaceChildren(...rows);
}

async function load() {
  try {
    const res = await run("read");
    items = res.data;
    $("domain").textContent = res.origin;
    render();
  } catch (err) {
    items = {};
    $("domain").textContent = "Can't open this page";
    setCount(0);
    showEmpty("This tab is off limits", err.message + " Try a regular website.");
  }
}

async function saveItem() {
  const key = $("key").value.trim();
  const value = $("value").value;

  if (!key) {
    $("key").focus();
    return;
  }

  const clash = key !== editingKey && key in items;
  if (clash && !confirm(`"${key}" already exists. Replace its value?`)) return;

  try {
    await run("save", key, value, editingKey);
    closeModal();
    await load();
  } catch (err) {
    showToast(err.message);
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse($("value").value);
    $("value").value = JSON.stringify(parsed, null, 2);
  } catch {
    showToast("That value isn't valid JSON.");
  }
}

async function clearAll() {
  if (!Object.keys(items).length) return;
  if (!confirm("Delete every localStorage item for this site?")) return;

  try {
    await run("clear");
    await load();
  } catch (err) {
    showToast(err.message);
  }
}

$("refresh").addEventListener("click", load);
$("search").addEventListener("input", render);
$("add").addEventListener("click", () => openModal());
$("close").addEventListener("click", closeModal);
$("cancel").addEventListener("click", closeModal);
$("save").addEventListener("click", saveItem);
$("format").addEventListener("click", formatJson);
$("clear").addEventListener("click", clearAll);

$("modal").addEventListener("click", (e) => {
  if (e.target === $("modal")) closeModal();
});

document.addEventListener("keydown", (e) => {
  const open = !$("modal").classList.contains("hidden");

  if (e.key === "Escape" && open) closeModal();
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && open) saveItem();
});

window.addEventListener("storage-edited", load);

load();
