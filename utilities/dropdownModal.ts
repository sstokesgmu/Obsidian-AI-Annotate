import {Modal, App} from 'obsidian';
import {Section} from './parser';

export default class DropDownModal extends Modal 
{   
    message: string;
    defaultValue: Section[];
    onSubmit: (value: any) => void;

    constructor(app: App, defaultValue: Section[], onSubmit: (value:string) => void) {
        super(app);
        this.message = "Pick the start and end of the note you want check";
        this.defaultValue = defaultValue;
        this.onSubmit = onSubmit;
    }

    //HTML content for the modal
    async onOpen()
    {
        const {contentEl} = this;
        //Add title to the modal
        contentEl.createEl('h2', {text: this.message});
        //creat a dropdown
        const startSelectEl = contentEl.createEl('select');
        this.defaultValue.forEach((option:Section) => startSelectEl.createEl('option', {text: option.heading, value:option.heading}));
        const endSelectEl = contentEl.createEl('select');
        this.defaultValue.forEach((option:Section) => endSelectEl.createEl('option',{text:option.heading, value:option.heading}))
        const button = contentEl.createEl('button', {text:'Submit'});
        button.addEventListener("click", () => {
            this.onSubmit({start:startSelectEl.value, end:endSelectEl.value})
            this.close();
        })
    }  
}