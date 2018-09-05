var vscode = require('vscode');
var process = require('process');
var fs = require('fs');
var util = require('util');
var os = require('os');

function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.petMaker', function () {

        let editor = vscode.window.activeTextEditor;
        let selected = editor.selection;

        let selectedText = editor.document.getText(selected);
        let cleanCode = selectedText;

        let snippetObject = {};

        vscode.languages.getLanguages()
            .then((listOfLanguages) => {
                return vscode.window.showQuickPick(listOfLanguages, { placeHolder: vscode.window.activeTextEditor.document.languageId });
            })
            .then(selectedLanguage => {
                snippetObject.lang = selectedLanguage;
                return vscode.window.showInputBox({ prompt: "Enter snippet name" });
            })
            .then((snippetName) => {
                snippetObject.name = snippetName;
                return vscode.window.showInputBox({ prompt: "Enter snippet prefix" });
            })
            .then(snippetPrefix => {
                snippetObject.prefix = snippetPrefix;
                return vscode.window.showInputBox({ prompt: "Enter snippet description" });
            })
            .then(snippetDesc => {
                snippetObject.description = snippetDesc;
            })
            .then(() => {

                let extansionPath;
                let delimiter = "/";

                let vscodeRelease = vscode.env.appName;

                // Check for insider version
                if(vscodeRelease === "Visual Studio Code - Insiders") {
                    [extansionPath,delimiter] = pickingRelease("Code - Insiders");
                } else {
                    [extansionPath,delimiter] = pickingRelease("Code");
                }

                var userSnippetsFile = extansionPath + util.format("snippets%s.json", delimiter + snippetObject.lang);
                if( snippetObject.name !== undefined && snippetObject.prefix !== undefined ) {
                    fs.readFile(userSnippetsFile, (err, txt) => {

                        if(txt) {
                            var check = txt.toString();
                        }

                        if(err) {
                            fs.open(userSnippetsFile, "w+", (err, fd) => {
                                if (err) {
                                    return;
                                } else {
                                    initFile(snippetObject, cleanCode, userSnippetsFile);
                                }
                            })
                        } else if(!check) {
                                    initFile(snippetObject, cleanCode, userSnippetsFile);
                        } else {

                            // TODO: Refactoring, code is damn mess.

                            var savedSnippets = txt.toString();
                            var restoreObject = JSON.parse(savedSnippets);

                            if (restoreObject[snippetObject.name] !== undefined || restoreObject[snippetObject.name] === null) {

                                vscode.window.showErrorMessage("Snippet with this name already exists");
                                return;

                            } else {

                                // Access to current file and append new object member
                                restoreObject[snippetObject.name] = {
                                        prefix: snippetObject.prefix,
                                        body: buildBodyFromText(cleanCode),
                                        description: snippetObject.description
                                    }
                                var snippetString = JSON.stringify(restoreObject, null, 2);
                                var toSave = snippetString;

                                fs.writeFile(userSnippetsFile, toSave, (err) => {
                                    if(err) vscode.window.showErrorMessage("Error while saving new snippet!");
                                })
                            }
                        }
                    })
                } else {
                    vscode.window.showWarningMessage("You need to enter Snippet name and Snippet prefix.");
                }
                   
            })
            
        context.subscriptions.push(disposable);
    });
}

function buildBodyFromText(text) {
    return text.split("\n");
}

function pickingRelease(name) {
    const osName = os.type();
    let delimiter = "/";
    let extansionPath;

    switch (osName) {
        case ("Darwin"): {
            extansionPath = process.env.HOME + "/Library/Application Support/" + name + "/User/";
            break;
        }
        case ("Linux"): {
            extansionPath = process.env.HOME + "/.config/" + name + "/User/";
            break;
        }
        case ("Windows_NT"): {
            extansionPath = process.env.APPDATA + "\\" + name + "\\User\\";
            delimiter = "\\";
            break;
        }
        default: {
            extansionPath = process.env.HOME + "/.config/" + name + "/User/";
            break;
        }
    }

    return [extansionPath,delimiter];
}

function initFile(snippObj, body, saveLocation) {
    var snippets = {}
    snippets[snippObj.name] = {
        prefix: snippObj.prefix,
        body: buildBodyFromText(body),
        description: snippObj.description
    }
    var snippetString = JSON.stringify(snippets, null, 2);
    var toSave = snippetString;

    fs.writeFile(saveLocation, toSave, (err) => {
        if(err) vscode.window.showErrorMessage("Error while saving new snippet!");
    })
}

exports.activate = activate;

function deactivate() {
}

exports.deactivate = deactivate;