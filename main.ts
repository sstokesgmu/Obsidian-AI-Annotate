import { Plugin, Notice, MarkdownView, Modal, App, TFile } from "obsidian";
import markdownToTxt from "markdown-to-txt";
import { OpenAI } from "openai";
import Parser from "utilities/parser";
import DropDownModal from "utilities/dropdownModal";
import * as dotenv from "dotenv";
import * as path from "path";

export default class AIAnnotatorPlugin extends Plugin {
	private openAI: OpenAI;

	async onload() {
		// Command to convert full note to plain text
		this.addCommand({
			id: "convert-to-plain-text",
			name: "Convert Note to Plain Text",
			callback: () => this.convertNoteToPlainText(),
		});
		console.log("AI Annotator Plugin Loaded!");
	}

	async convertNoteToPlainText() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("No active markdown note found!");
			return;
		}
		let markdownContent = activeView.editor.getValue();
		//ToDo: get a list of all headings in the note and list them out in the modal
		const parser = new Parser(markdownContent);
		const sections = parser.getHeadings();

		//? What is returned from this fuction
		const func = async (sections): Promise<any> => {
			return new Promise((resolve) => {
				const modal = new DropDownModal(this.app, sections, resolve);
				modal.open();
			});
		};
		const bounds = await func(sections);
		console.log(bounds);
		const response: string | undefined = await this.sendToOpenAI(
			parser.getContent(bounds),
		);
		//
		//TODO: Organize the response in a  side bar that I can use
		await this.createNewNote(response);
		new Notice("Conversion to plain text completed!");
	}
	async sendToOpenAI(text: any) {
		try {
			const response = await fetch(
				"https://obsidian-plugin-server.onrender.com/",
				{
					method: "POST",
					body: text,
				},
			);
			new Notice("Sending Response ...");
			const thing = await response.text();
			//? Is there an possible exception here?
			new Notice("Respose Returned!");
			return thing;
		} catch (error) {
			console.error("Error communicating with OpenAI", error);
			new Notice("Error during AI review");
		}
	}

	async createNewNote(content: string) {
		console.log("Creating new note...");

		const markdownContent = `## AI Review\n\n${content}`;

		// Generate a valid file name by sanitizing the timestamp (remove invalid characters)
		const fileName = `AI_Review_${new Date()
			.toISOString()
			.replace(/[:]/g, "-")}.md`; // Replace colons with dashes
		const folderPath = "AI_Reviews"; // Folder path for the note
		const filePath = `${folderPath}/${fileName}`; // Full file path including the folder

		try {
			// Ensure the folder exists
			const folderExists =
				await this.app.vault.adapter.exists(folderPath);
			if (!folderExists) {
				// If folder doesn't exist, create it
				await this.app.vault.createFolder(folderPath);
			}

			// Create the new file with the given content
			await this.app.vault.create(filePath, markdownContent);

			// Get the active file in the workspace
			const activeFile = this.app.workspace.getActiveFile();

			// Get the file object for the newly created file
			const newFileObj = this.app.vault.getAbstractFileByPath(filePath);

			if (newFileObj instanceof TFile) {
				// Append a link to the active file in the newly created file
				await this.app.vault.append(
					newFileObj,
					`\n\n# Document Link:\n[[${activeFile?.name}]]`,
				);
			} else {
				new Notice("Error: New file could not be found.");
			}

			// Get the current active file (if it exists) and append content
			if (activeFile instanceof TFile) {
				await this.app.vault.append(
					activeFile,
					`\n\n## App Review: \n[[${newFileObj?.name}]]`,
				);
			} else {
				new Notice("Error: Active file could not be found.");
			}

			// Show a notice to the user
			new Notice(`New note created: ${filePath}`);

			//Todo Add the backlink to the current file
		} catch (error) {
			console.error("Error creating note:", error);
			new Notice("Failed to create a new note");
		}
	}

	async onunload() {
		console.log("AI Annotator Plugin Unloaded!");
	}
}

// class InputModal extends Modal {
// 	message: string;
// 	defaultValue: string;
// 	onSubmit: (value: string) => void;

// 	constructor(
// 		app: App,
// 		message: string,
// 		defaultValue: string,
// 		onSubmit: (value: string) => void
// 	) {
// 		super(app);
// 		this.message = message;
// 		this.defaultValue = defaultValue;
// 		this.onSubmit = onSubmit;
// 	}

// 	createBounds() {}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 		contentEl.createEl("h2", { text: this.message });

// 		const input = contentEl.createEl("input", {
// 			type: "text",
// 			value: this.defaultValue,
// 		});
// 		input.style.width = "100%";

// 		const submitButton = contentEl.createEl("button", { text: "OK" });
// 		submitButton.style.marginTop = "10px";

// 		submitButton.addEventListener("click", () => {
// 			this.onSubmit(input.value);
// 			this.close();
// 		});
// 	}
// }
// // Helper Method to prompt the user for input using Obsidian's modal
// async promptUser(message: string, defaultValue: string): Promise<string> {
// 	return new Promise((resolve) => {
// 		const modal = new InputModal(
// 			this.app,
// 			message,
// 			defaultValue,
// 			resolve
// 		);
// 		modal.open();
// 	});
// }
