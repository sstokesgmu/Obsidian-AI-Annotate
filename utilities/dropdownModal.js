import { __awaiter } from "tslib";
import { Modal } from 'obsidian';
export default class DropDownModal extends Modal {
    constructor(app, defaultValue, onSubmit) {
        super(app);
        this.message = "Pick the start and end of the note you want check";
        this.defaultValue = defaultValue;
        this.onSubmit = onSubmit;
    }
    //HTML content for the modal
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contentEl } = this;
            //Add title to the modal
            contentEl.createEl('h2', { text: this.message });
            //creat a dropdown
            const startSelectEl = contentEl.createEl('select');
            this.defaultValue.forEach((option) => startSelectEl.createEl('option', { text: option.heading, value: option.heading }));
            const endSelectEl = contentEl.createEl('select');
            this.defaultValue.forEach((option) => endSelectEl.createEl('option', { text: option.heading, value: option.heading }));
            const button = contentEl.createEl('button', { text: 'Submit' });
            button.addEventListener("click", () => {
                this.onSubmit({ start: startSelectEl.value, end: endSelectEl.value });
                this.close();
            });
        });
    }
}