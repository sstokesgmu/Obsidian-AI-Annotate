import { Plugin, Notice, MarkdownView, Modal, App } from "obsidian";
import markdownToTxt from "markdown-to-txt";

export default class AIAnnotatorPlugin extends Plugin {
  async onload() {
    console.log("AI Annotator Plugin Loaded!");
    // Command to convert full note to plain text
    this.addCommand({
      id: "convert-to-plain-text",
      name: "Convert Note to Plain Text",
      callback: () => this.convertNoteToPlainText(),
    });
  }

  async convertNoteToPlainText() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("No active markdown note found!");
      return;
    }

    let markdownContent = activeView.editor.getValue();

    // Prompt user for start and end markers using Obsidian's modal
    const startMarker = await this.promptUser("Enter the start marker:", "Table of Contents");
    const endMarker = await this.promptUser("Enter the end marker:", "See Also Internal Reference");

	// Adjusted regex to capture headings properly
	const regex = new RegExp(
		`(^|\\n)(#{1,6}\\s*)?${startMarker}([\\s\\S]*?)(#{1,6}\\s*)?${endMarker}($|\\n)`,
		"i"
	);
	let extractedContent = markdownContent.match(regex);
	if (extractedContent) {
		markdownContent = extractedContent[0];
	} else {
		new Notice("No matching section found");
		return;
	}
  

    // Remove full code blocks (triple backticks ``` and tilde blocks ~~~)
    markdownContent = markdownContent.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "");
    // Remove images (![alt text](url) and Obsidian-style ![[image]] embeds)
    markdownContent = markdownContent.replace(/!\[.*?\]\(.*?\)/g, "");
    markdownContent = markdownContent.replace(/!\[\[.*?\]\]/g, "");

    // Convert Markdown to plain text
    const plainText = markdownToTxt(markdownContent);
    new Notice("Conversion to plain text completed!");
    console.log("Plain Text Output:", plainText);
  }

  // Helper Method to prompt the user for input using Obsidian's modal
  async promptUser(message: string, defaultValue: string): Promise<string> {
    return new Promise((resolve) => {
      const modal = new InputModal(this.app, message, defaultValue, resolve);
      modal.open();
    });
  }

  async onunload() {
    console.log("AI Annotator Plugin Unloaded!");
  }
}

class InputModal extends Modal {
  message: string;
  defaultValue: string;
  onSubmit: (value: string) => void;

  constructor(app: App, message: string, defaultValue: string, onSubmit: (value: string) => void) {
    super(app);
    this.message = message;
    this.defaultValue = defaultValue;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.message });

    const input = contentEl.createEl("input", { type: "text", value: this.defaultValue });
    input.style.width = "100%";

    const submitButton = contentEl.createEl("button", { text: "OK" });
    submitButton.style.marginTop = "10px";

    submitButton.addEventListener("click", () => {
      this.onSubmit(input.value);
      this.close();
    });
  }
}
