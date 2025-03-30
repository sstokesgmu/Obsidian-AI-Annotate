import { Plugin, Notice, MarkdownView, Modal, App } from "obsidian";
import markdownToTxt from "markdown-to-txt";
import { OpenAI } from "openai";
import Parser from "utilities/parser";
import DropDownModal from "utilities/dropdownModal";
import * as dotenv from "dotenv";
import * as path from "path";

export default class AIAnnotatorPlugin extends Plugin {
	private openAI: OpenAI;

	async onload() {
		const hiddenFile = this.app.vault.configDir;
		const desktopPath = path.join(
			"C:",
			"Users",
			"sterl",
			"Desktop",
			"Test"
		);
		let b = path.join(
			desktopPath,
			hiddenFile,
			"plugins",
			"obsidian-ai-annotator"
		);
		const envPath = path.resolve(b, ".env");
		dotenv.config({ path: envPath });
		//Initialize OpenAI client
		this.openAI = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
			dangerouslyAllowBrowser: true,
		});
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
		const func = async (sections): Promise<any> => {
			return new Promise((resolve) => {
				const modal = new DropDownModal(this.app, sections, resolve);
				modal.open();
			});
		};
		const bounds = await func(sections);
		parser.getContent(bounds);
		new Notice("Conversion to plain text completed!");
		// const response = await this.sendToOpenAI(b);
		// organize the response in a  side bar that I can use
		// await this.openNewNote(response as string);
	}

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

	async sendToOpenAI(text: string) {
		const systemMessage = `
    You are an AI fact checker, content organizer, and resource recommender. Your goal is to review the provided text, ensuring factual accuracy, logical flow, and clear content organization, as well as suggesting resources for further reading.

Instructions:
Fact Checks: Identify and correct any inaccurate or misleading information. When correcting, provide the verified fact and, if possible, include a reliable citation or source to back up the correction.
Content Structure: Evaluate the structure of the content. Suggest better ways to organize the material to improve clarity, logical flow, and the reader's understanding. Recommend where additional context, sections, or headings may be needed.
Steering the Thought Process: Ensure that the content follows a clear, rational progression. Suggest improvements where the text seems disjointed or lacks logical connections. Guide the content towards a more coherent and well-supported argument.
Content Depth: Recommend areas that could benefit from further elaboration, examples, or references to strengthen the points being made.
Further Reading: Suggest resources, books, articles, or papers that the reader can explore to gain a deeper understanding of the topic discussed. Include references or citations where applicable.
Annotations: Provide annotations where applicable, such as identifying unclear or unsupported statements, and offering suggestions for how the content could be improved in terms of content depth or structure.
Format:
For Fact Checks: Provide the original statement, followed by the corrected statement with an explanation, and ideally a source to verify the correction.make sure to use Fact Check: ❌ and Correction: ✅

Example: Fact Check: ❌ "The Eiffel Tower was built in 1870." ✅ Correction: "The Eiffel Tower was built in 1887 and completed in 1889." (Source: Wikipedia)

For Content Structure: Suggest reorganization, additions, or improvements to the flow of information.

Example:

Reorganize the content so that the introduction provides a clear overview, followed by the background section, before diving into the main argument. Add a conclusion summarizing the key points.
For Steering the Thought Process: Identify where the argument may lose coherence and provide a more logically sound alternative.

Example:

"The argument about climate change lacks scientific consensus." → "The scientific consensus on climate change is overwhelming, with over 97% of climate scientists agreeing that human activities are driving global warming."
For Content Depth: Identify areas where the content could benefit from more details, examples, or references.

Example:

"The causes of World War I are complex." → "The causes of World War I are multifaceted, including nationalism, militarism, alliances, and the assassination of Archduke Franz Ferdinand. Further reading can be found in The Sleepwalkers by Christopher Clark."
For Further Reading: Suggest areas where the reader could explore more in-depth material.

Example:

"To learn more about climate change and its impact on global weather patterns, refer to The Discovery of Global Warming by Spencer Weart or The Uninhabitable Earth by David Wallace-Wells."
Provide your analysis in clear, plain text, using Markdown formatting where necessary.
    `;

		try {
			const response = await this.openAI.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{ role: "system", content: systemMessage },
					{ role: "user", content: text },
				],
			});

			const result = response.choices[0].message.content;
			return result;
		} catch (error) {
			console.error("Error communicating with OpenAI", error);
			new Notice("Error during AI review");
		}
	}

	async openNewNote(content: string) {
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
			const folderExists = await this.app.vault.adapter.exists(
				folderPath
			);
			if (!folderExists) {
				// If folder doesn't exist, create it
				await this.app.vault.createFolder(folderPath);
			}

			// Create the new file with the given content
			await this.app.vault.create(filePath, markdownContent);
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
