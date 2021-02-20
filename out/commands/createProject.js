"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
const fs_1 = require("fs");
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = require("path");
const process_1 = require("process");
const isRequired_1 = __importDefault(require("../utils/isRequired"));
const settings_1 = require("./settings");
const main_1 = require("../main");
const github_1 = require("./github");
function createProject(projectName, application = "default") {
    let settingsApplication = settings_1.getAppSettings(application);
    const settings = settings_1.getFullSettings();
    const { ghUnauthorized, projectFolder } = {
        ghUnauthorized: settings.ghUnauthorized,
        projectFolder: settings.projectPath,
    };
    let _dir = path_1.join(projectFolder, projectName);
    const createLocally = (dir) => {
        try {
            fs_1.mkdirSync(dir);
            process_1.chdir(dir);
            console.log("Opening in: ", process.cwd().magenta);
            if (application !== "default") {
                console.log(`===============${application.toUpperCase()}===============`.cyan);
                settingsApplication = settings_1.getAppSettings(application);
                if (settingsApplication.packages.length > 0 &&
                    settingsApplication.package_origin === "requirements.txt") {
                    for (let p of settingsApplication.packages) {
                        shelljs_1.exec(`echo ${p} >> requirements.txt`);
                    }
                }
                settings_1.executeCommands(settingsApplication.commands);
            }
            shelljs_1.exec(`${settings.editor} .`);
        }
        catch (error) {
            if (error.code === "EEXIST")
                console.log(`This project already exists at ${error.path} !`.red);
            else
                console.error(error);
        }
    };
    if (application !== "default") {
        settingsApplication = settings_1.getAppSettings(application);
        _dir = path_1.join(projectFolder, settingsApplication.path, projectName);
    }
    if (!ghUnauthorized.includes(application) && main_1.env.token) {
        inquirer_1.default
            .prompt([
            {
                type: "confirm",
                default: true,
                message: "Create a GitHub repository?".green,
                name: "createRepo",
                validate: isRequired_1.default,
            },
        ])
            .then((answer) => {
            if (answer.createRepo) {
                inquirer_1.default
                    .prompt([
                    {
                        type: "list",
                        choices: ["Private", "Public"],
                        default: 0,
                        message: "Private or public".green,
                        name: "isPrivate",
                        validate: isRequired_1.default,
                    },
                ])
                    .then((answer) => {
                    if (answer.isPrivate === "Private") {
                        createLocally(_dir);
                        github_1.createRepo(projectName, true);
                    }
                    else {
                        createLocally(_dir);
                        github_1.createRepo(projectName, false);
                    }
                });
            }
            else
                createLocally(_dir);
        });
    }
    else {
        createLocally(_dir);
    }
}
exports.default = createProject;
