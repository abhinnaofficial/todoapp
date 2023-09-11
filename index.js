import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";


const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/images'));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));





const TASKS_FILE_PATH = path.join(__dirname, "tasks.json"); // Define the path to the JSON file

const tasks = []; // store the task name.
const tasksCompleted = []; // store the task state if its complete/incomplete.
const tasksPriority = []; // store the priority.
const tasksCategory = [];
const tasksTags = [];

function saveTasksToFile() {
    const data = JSON.stringify({ tasks, tasksCompleted, tasksPriority, tasksCategory, tasksTags });
    fs.writeFileSync(TASKS_FILE_PATH, data, "utf8");
}

function loadTasksFromFile() {
    try {
        const data = fs.readFileSync(TASKS_FILE_PATH, "utf8");
        const parsedData = JSON.parse(data);

        tasks.length = 0; // Clear existing tasks
        tasksCompleted.length = 0; // Clear existing completed status
        tasksPriority.length = 0; // Clear existing priorities
        tasksCategory.length = 0;
        tasksTags.length = 0;

        tasks.push(...parsedData.tasks);
        tasksCompleted.push(...parsedData.tasksCompleted);
        tasksPriority.push(...parsedData.tasksPriority);
        tasksCategory.push(...parsedData.tasksCategory);
        tasksTags.push(...parsedData.tasksTags.map(tagList => Array.isArray(tagList) ? tagList : []));
        console.log("tasksTags:", tasksTags);

    } catch (error) {
        // If the file doesn't exist or there's an error, initialize with empty arrays
        tasks.length = 0;
        tasksCompleted.length = 0;
        tasksPriority.length = 0;
        tasksCategory.length = 0;

    }
}

// Load tasks from the JSON file when the server starts
loadTasksFromFile();



function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}


// home page.
app.get("/", (req, res) => {
    const selectedCategory = req.query.category || 'all';
    res.render('index.ejs', { formatDate, tasks, tasksCompleted, tasksPriority, tasksCategory, selectedCategory, tasksTags });
});

// post request for task creation.
app.post("/create", (req, res) => {

    const taskName = req.body.taskName;
    const priority = req.body.priority;
    const category = req.body.category; // Get the selected category
    const tags = req.body.tags.split(',').map(tag => tag.trim()); // Split and trim tags



    if (taskName) {

        tasks.push(taskName); // push the taskName to the tasks array to be sent to the ejs form.

        tasksCompleted.push(false); // Initialize task as not completed.

        tasksPriority.push(priority); // push the priority in the tasksPriority array to be sent to the ejs form.
        console.log("Priority added:", priority);
        tasksCategory.push(category); // Save the selected category along with the task
        console.log("Category added:", category);


        if (tags.length > 0 && tags[0] !== "") {
            tasksTags.push(tags); // Assign the array of tags directly if it's not empty or just an empty string
        } else {
            tasksTags.push([]); // Push an empty array if tags are empty
        }; // Assign the array of tags directly

        console.log("tag", tasksTags);

        saveTasksToFile();


    }


    res.redirect('/');

});


// post request for task completion/incompletion toggler.
app.post("/toggle", (req, res) => {
    const index = req.body.index;

    tasksCompleted[index] = !tasksCompleted[index]; // Toggle task completion to true or false with each time we press on checkbox

    res.redirect('/');
});

// delete 
app.post("/delete", (req, res) => {
    const index = req.body.index;
    // Remove the task at the specified index from the arrays
    const removedCategory = tasksCategory[index];

    // Remove the task at the specified index from the arrays
    tasks.splice(index, 1);
    tasksCompleted.splice(index, 1);
    tasksPriority.splice(index, 1);
    tasksCategory.splice(index, 1);
    tasksTags.splice(index, 1);

    // Remove the task's category if it's not used anymore
    const hasCategoryTasks = tasksCategory.some(category => category === removedCategory);
    if (!hasCategoryTasks) {
        const categoryIndex = tasksCategory.indexOf(removedCategory);
        tasksCategory.splice(categoryIndex, 1);
    }


    console.log("success");
    saveTasksToFile(); // Save the updated arrays to the file


    res.redirect('/');
});


// post request for task editing.
app.post("/edit", (req, res) => {
    const index = req.query.index; // Use req.query to get query parameters
    const newTaskName = req.query.newTaskName;

    tasks[index] = newTaskName; // Update the task name


    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});



