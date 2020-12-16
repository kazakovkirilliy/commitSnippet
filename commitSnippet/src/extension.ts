import * as vscode from 'vscode';
import { LocalStorageService } from './LocalStorage';
import { GitExtension, Repository } from "./api/git";

export function activate(context: vscode.ExtensionContext) {

	const functions: any = [
		{
			title: `$(pencil) ADD`,
			body: `~/Adds new snippet`
		}, 
		{
			title: "$(flame) DELETE SNIPPET",
			body: "~/Deletes specific snippet"
		}
	];

	const snippets: any = [];

	const localStorage = new LocalStorageService(context.workspaceState);


	let manageSnippets = vscode.commands.registerCommand('commitSnippets.manage', (uri?) => {

		if (localStorage.getValue("functions") == null) {
			localStorage.setValue("functions", functions);
		}

		const result: any = localStorage.getValue("functions");

		// Create QuickPick and set its buttons` behavior

		const quickPick = vscode.window.createQuickPick();
		quickPick.items = result.map((x: any) => ({label: x.title, description: x.body}))
		quickPick.onDidChangeSelection(([item])=> {
			if (item.label == result[0].title) {
				let temp: any = localStorage.getValue("snippets");
				const iba = vscode.window.createInputBox();
				iba.placeholder = "Enter snippet message";
				iba.show();
				iba.onDidAccept(() => {
					if (iba.value !== '') {
						temp.push( {
							body: iba.value,
							title: temp.length.toString()
						})
						localStorage.setValue("snippets", temp);
					}
					iba.dispose();
					
				})
			} else if (item.label == result[1].title) {
				const ibb = vscode.window.createInputBox();
				let temp: any = localStorage.getValue("snippets");
				ibb.placeholder = "Enter snippet id";
				ibb.show();
				ibb.onDidAccept(() => {
					let val = parseInt(ibb.value);
					if (val && ibb.value != functions[0].title && ibb.value != functions[1].title) {
						temp.splice(val, 1)
						for (val; val < temp.length; val++) {
							temp[val].title = val.toString();
						}
						localStorage.setValue("snippets", temp)
					}
					ibb.dispose();
				})
			}
			quickPick.dispose();
		})

		quickPick.onDidHide(() => quickPick.dispose())
		quickPick.show();

	});


	let showSnippets = vscode.commands.registerCommand('commitSnippets.show', (uri?) => {
	
		const result: any = localStorage.getValue("snippets");

		if (localStorage.getValue("snippets") == null) {
			localStorage.setValue("snippets", snippets);
			vscode.commands.executeCommand('commitSnippets.manage');
		}

		const git = getGitExtension();
		if (!git) {
			vscode.window.showErrorMessage("Unable to load Git Extension");
			return;
		}

		const quickPick = vscode.window.createQuickPick();
		quickPick.items = result.map((x: any) => ({label: x.title, description: x.body}))
		quickPick.onDidChangeSelection(([item])=> {
			if (uri) {
				let selectedRepository = git.repositories.find((repository) => {
					return repository.rootUri.path === uri._rootUri.path;
				});
				if (selectedRepository) {
						prefixCommit(selectedRepository, item.description!);
				}
				} else {
					for (let repo of git.repositories) {
						prefixCommit(repo, item.description!);
					}
				}
				vscode.window.showInformationMessage("Snippet is inserted into the commit message");
				quickPick.dispose();
			})

			quickPick.onDidHide(() => quickPick.dispose())
			quickPick.show();
		});

	context.subscriptions.push(manageSnippets);
	context.subscriptions.push(showSnippets);
}

function prefixCommit(repository: Repository, prefix: String) {
	repository.inputBox.value = `${prefix} ${repository.inputBox.value}`;
}

function getGitExtension() {
	const vscodeGit = vscode.extensions.getExtension<GitExtension>("vscode.git");
	const gitExtension = vscodeGit && vscodeGit.exports;
	return gitExtension && gitExtension.getAPI(1);
}

export function deactivate() {}
