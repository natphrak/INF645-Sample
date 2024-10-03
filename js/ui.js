import {openDB} from "https:unpkg.com/idb?module";

document.addEventListener("DOMContentLoaded", function(){
    // Sidenav initialization
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
    // Add Task
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });

    loadTasks();

    checkStorageUsage();
})

if("serviceWorker" in navigator){
    navigator.serviceWorker
        .register('/serviceworker.js')
        .then((req) => console.log('Service Worker Registered!', req))
        .catch((err) => console.log("Service Worker Registration Failed", err));
    
}

// create indexDB database
async function createDB(params) {
    const db = await openDB("taskManager", 1, {
        upgrade(db) {
            const store = db.createObjectStore("tasks", {
                keyPath: "idk",
                autoIncrement: true,
            });
            store.createIndex("status", "status");
        },
    });
    return db;
}

// Add task
async function addTask(task) {
    const db = await createDB();

    // start transaction
    const tx = db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");

    // Add task to store
    await store.add(task);

    // complete transaction
    await tx.done;

    // update storage usage
    checkStorageUsage();
}

// Delete task
async function deleteTask(id) {
    const db = await createDB();

    // Start transaction
    const tx = db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");

    // Delete task by id
    await store.delete(id);

    await tx.done;

    // Remove task from UI
    const taskCard = document.querySelector(`[data-id="${id}"]`);
    if (taskCard) {
        taskCard.remove();
    }

    // update storage usage
    checkStorageUsage();
}

// Load tasks with transaction
async function loadTasks() {
    const db = await createDB();

    // Start transaction
    const tx = db.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");

    // Get all tasks
    const tasks = await store.getAll();

    await tx.done;

    const taskContainer = document.querySelector(".tasks");
    taskContainer.innerHTML = "";
    tasks.forEach((task) => {
        displayTask(task);
    });
}

// Display task using the existing HTML structure
function displayTask(task) {
    const taskContainer = document.querySelector(".tasks");
    const html = `
            <div class="card-panel white row valign-wrapper" data-id=${task.id}>
                <div class="col s2">
                    <img src="/img/task.png" class="circle responsive-img" alt="Task Icon" />
                </div>
                <div class="task-details col s8">
                    <h5 class="task-title black-text">${task.title}</h5>
                    <div class="task-description">
                        ${task.description}
                    </div>
                </div>
                <div class="col s2 right-align">
                    <button class="task-delete btn-flat" aria-label="Delete Task">
                        <i class="material-icons black-text-darken-1">delete_outline</i>
                    </button>
                </div>
            </div>`;

    taskContainer.insertAdjacentHTML("beforeend", html);

    // Attach delete event listener
    const deleteButton = taskContainer.querySelector(`
        [data-id="${id}"] .task-delete`
    );

    deleteButton.addEventListener("click", () => deleteTask(task.id));
}

// Add task button listener
const addTaskButton = document.querySelector(".btn-small");
addTaskButton.addEventListener("click", async () => {
    const titleInput = document.querySelector("#title");
    const descriptionInput = document.querySelector("#description");

    const task = {
        title: titleInput.value,
        description: descriptionInput.value,
        status: "pending",
    };

    await addTask(task);
    displayTask(task);

    titleInput.value = "";
    descriptionInput.value = "";

    const forms = document.querySelector(".side-form");
    const instance = M.Sidenav.getInstance(forms);
    instance.close();
});

async function checkStorageUsage() {
    if(navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();

        const usageInMB = (usage / (1024 * 1024).toFixed(2));
        const quotaInMB = (quota / (1024 * 1024).toFixed(2));

        console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

        // update the UI
        const storageInfo = document.querySelector("#storage-info");
        if (storageInfo) {
            storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
        }

        if(usage/quota > 0.8) {
            const storageWarning = document.querySelector("#storage-warning");
            if(storageWarning) {
                storageWarning.textContent = "Warning: You are running low on data";
                storageWarning.style.display = "block";
            } else {
                const storageWarning = document.querySelector("#storage-warning");
                if(storageWarning) {
                    storageWarning.textContent = "";
                    storageWarning.style.display = "none";
                }
            }
        }
    }
}