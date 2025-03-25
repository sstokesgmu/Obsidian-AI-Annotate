import markdownToTxt from "markdown-to-txt";

interface Rule {
	regPattern: RegExp;
	description: string;
}

interface Section
{
    heading: string;
    content: string; //lower heading or strings
}

class Parser {
	rules: Rule[];
	options: Object;
	markdownContent: string;

	constructor(content: string, options: Object) {
		this.rules = [
			{ regPattern: /#{6}\s?([^\n]+)/g, description: "h6" },
			{ regPattern: /#{5}\s?([^\n]+)/g, description: "h5" },
			{ regPattern: /#{4}\s?([^\n]+)/g, description: "h4" },
			{ regPattern: /#{3}\s?([^\n]+)/g, description: "h3" },
			{ regPattern: /#{2}\s?([^\n]+)/g, description: "h2" },
			{ regPattern: /#{1}\s?([^\n]+)/g, description: "h1" },
			{
				regPattern: /```[\s\S]*?```|~~~[\s\S]*?~~~/g,
				description: "codeblocks",
			},
			{ regPattern: /!\[\[.*?\]\]/g, description: "images" },
			{ regPattern: /!\[.*?\]\(.*?\)/g, description: "link" },
		];

        //options should be optional
		this.options = options;
		this.markdownContent = content;
	}
	//Methods
	getSections() {
        const sections: Section[] = [];
        let currentSection: Section | null = null;
        //?This allows us to create substrings that still match the regex expression
        let match: RegExpExecArray | null;

        const regex = /#{1,6}\s?([^\n]+)/g; //regex to match all headings of all levels 

        let lastIndex = 0; //To track the last matched position out of the whole array

        while ((match = regex.exec(this.markdownContent)) !== null)
        {
            const heading = match[1]; // The heading text
            const headingStartIndex = match.index; //position of the heading
            const headingEndIndex = regex.lastIndex; //End position of the heading

            //If this is not the first seciton, capture the contennt from the last heading 
            if (currentSection) {
                const content = this.markdownContent.slice(lastIndex,headingStartIndex).trim();
                currentSection.content = content; // Store the content of the previous section
                sections.push(currentSection);
            }

            // Update the last index to the end of the current heading
            lastIndex = headingEndIndex;

            //Create a new section for the current heading 
            currentSection = {
                heading: heading,
                content: '', //Content will be filled later.
            }
        }

        //After the loop, we still need to capture the content after the last heading
        if (currentSection)
        {
            const content = this.markdownContent.slice(lastIndex).trim();
            currentSection.content = content;
            sections.push(currentSection);
        }

        return sections.
    }
	findandRemove(options) {}
	translateToPlaintext() {
		return markdownToTxt(this.markdownContent);
	}

	//options class
}
