import { Plugin, Notice, MarkdownView, Modal, App,FileSystemAdapter } from "obsidian";
import markdownToTxt from "markdown-to-txt";
import {OpenAI} from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

export default class AIAnnotatorPlugin extends Plugin {
  private openAI:OpenAI;

  async onload() 
  {
    const hiddenFile = this.app.vault.configDir;
    const desktopPath = path.join('C:', 'Users', 'sterl', 'Desktop', 'Test');
    let b = path.join(desktopPath,hiddenFile,'plugins','obsidian-ai-annotator');

    console.log(b);
    const envPath = path.resolve(b,'.env');
    console.log(envPath);
    console.log(dotenv.config({path:envPath}));

    //Initialize OpenAI client 
    this.openAI = new OpenAI({apiKey: process.env.OPENAI_API_KEY,dangerouslyAllowBrowser:true})

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
    console.log(`What is the extracted content ${extractedContent[0]}`);
	} else {
    //? Else grab the whole note
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
   
    const response = await this.sendToOpenAI(plainText);
  }

  // Helper Method to prompt the user for input using Obsidian's modal
  async promptUser(message: string, defaultValue: string): Promise<string> {
    return new Promise((resolve) => {
      const modal = new InputModal(this.app, message, defaultValue, resolve);
      modal.open();
    });
  }

  async sendToOpenAI(text: string)
  {
    const systemMessage = 
    `
      You are an AI fact checker and editor. Your goal is to review the provided text, ensuring factual accuracy and clarity.
    
    Instructions:
    Fact Checks: Identify only inaccurate information and correct it with a verified fact. Include a citation if possible.
    Annotations: Suggest edits where clarity, conciseness, or readability can be improved.
    
    Format:
    For Fact Checks: Print the original line, followed by the corrected version with an explanation.
    For Edits: Highlight unclear or verbose sentences and provide a more concise alternative.
    
    Example Output:
    Fact Check:
    
    ❌ "The Eiffel Tower was built in 1870."
    ✅ Correction: "The Eiffel Tower was built in 1887 and completed in 1889." (Source: Wikipedia)
    
    Edit Suggestion:
    
    ❌ "This particular topic, which is often discussed in various academic papers, is very complex and difficult to understand."
    ✅ Improved: "This topic is widely discussed in academic papers and is complex to understand."
    
    Provide your analysis in plain text with Markdown formatting where applicable.
    `;

    try {
      const response = await this.openAI.chat.completions.create(
        {
          model:'gpt-4o-mini',
          messages: [
              {role: 'system', content: systemMessage},
              {role: 'user', content:text}
          ]
        });

        const result = response.choices[0].message.content;
        console.log("AI Review Result:", result);
    } catch (error) {
      console.error("Error communicating with OpenAI",error);
      new Notice("Error during AI review");
    }
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
