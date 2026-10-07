let editingKey = null;

const $ = (id) => document.getElementById(id);

async function execute(func, args = []) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("No active tab.");
  }

  const results = await chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    func,
    args
  });

  return results[0]?.result;
}

async function getStorage() {
  return execute(() => {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }

    return {
      origin: location.origin,
      data
    };
  });
}

async function saveStorage(key, value, oldKey = null) {
  return execute((key, value, oldKey) => {
    if (oldKey && oldKey !== key) {
      localStorage.removeItem(oldKey);
    }

    localStorage.setItem(key, value);

    return true;
  }, [key, value, oldKey]);
}

async function deleteStorage(key) {
  return execute((key) => {
    localStorage.removeItem(key);

    return true;
  }, [key]);
}

async function clearStorage() {
  return execute(() => {
    localStorage.clear();

    return true;
  });
}

function openModal(key = "", value = "") {
  editingKey = key || null;

  $("modal-title").textContent = editingKey
    ? "Edit item"
    : "Add item";

  $("key").value = key;
  $("value").value = value;

  $("modal").classList.remove("hidden");
  $("key").focus();
}

function closeModal() {
  $("modal").classList.add("hidden");

  editingKey = null;

  $("key").value = "";
  $("value").value = "";
}

function render(data) {
  const container = $("storage");
  const search = $("search").value.toLowerCase();

  const entries = Object.entries(data).filter(([key, value]) => {
    return (
      key.toLowerCase().includes(search) ||
      String(value).toLowerCase().includes(search)
    );
  });

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty">
        ${search ? "No matching items" : "No local storage items"}
      </div>
    `;
  }

  for (const [key, value] of entries) {
    const item = document.createElement("div");
    item.className = "item";

    const keyElement = document.createElement("div");
    keyElement.className = "key";
    keyElement.textContent = key;
    keyElement.title = key;

    const valueElement = document.createElement("div");
    valueElement.className = "value";
    valueElement.textContent = value;
    valueElement.title = value;

    const actions = document.createElement("div");
    actions.className = "actions";

    const edit = document.createElement("button");
    edit.className = "action";
    edit.title = "Edit";
    edit.innerHTML = `
      <span class="material-symbols-outlined">edit</span>
    `;

    edit.addEventListener("click", () => {
      openModal(key, value);
    });

    const remove = document.createElement("button");
    remove.className = "action delete";
    remove.title = "Delete";
    remove.innerHTML = `
      <span class="material-symbols-outlined">delete</span>
    `;

    remove.addEventListener("click", async () => {
      await deleteStorage(key);
      await load();
    });

    actions.append(edit, remove);
    item.append(keyElement, valueElement, actions);
    container.appendChild(item);
  }

  $("count").textContent =
    `${Object.keys(data).length} item${Object.keys(data).length === 1 ? "" : "s"}`;
}

async function load() {
  try {
    const result = await getStorage();

    $("domain").textContent = result.origin;

    render(result.data);
  } catch {
    $("domain").textContent = "Cannot access this page";

    $("storage").innerHTML = `
      <div class="empty">
        This page cannot be accessed.
      </div>
    `;

    $("count").textContent = "0 items";
  }
}

$("refresh").addEventListener("click", load);

$("search").addEventListener("input", load);

$("add").addEventListener("click", () => {
  openModal();
});

$("close").addEventListener("click", closeModal);

$("cancel").addEventListener("click", closeModal);

$("save").addEventListener("click", async () => {
  const key = $("key").value;
  const value = $("value").value;

  if (!key.trim()) {
    $("key").focus();
    return;
  }

  try {
    await saveStorage(key, value, editingKey);

    closeModal();

    await load();
  } catch (error) {
    alert(error.message);
  }
});

$("clear").addEventListener("click", async () => {
  const result = await getStorage();

  if (!Object.keys(result.data).length) {
    return;
  }

  if (!confirm("Clear all local storage?")) {
    return;
  }

  await clearStorage();

  await load();
});

$("modal").addEventListener("click", (event) => {
  if (event.target === $("modal")) {
    closeModal();
  }
});

load();