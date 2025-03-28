import markdownToTxt from "markdown-to-txt";

interface Rule {
	regPattern: RegExp;
	description: string;
}

export interface Section
{
    heading: string;
    content: string; //lower heading or strings
}

export default class Parser {
	rules: Rule[];
	options: Object;
	markdownContent: string
	constructor(content: string) {
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
		this.markdownContent = content;
	}
	//Methods
	getSections() {
        const sections: Section[] = [];
        let lastSection: Section | null = null;
        //?This allows us to create substrings that still match the regex expression
        let match: RegExpExecArray | null;

        const regex = /#{1,6}\s?([^\n]+)/g; //regex to match all headings of all levels 

        let lastIndex = 0; //To track the where to start the next 
        while ((match = regex.exec(this.markdownContent)) !== null)
        {
            const heading = match[1]; // Heading Text will be the full heading
            const headingStartIndex = match.index;
            const headingEndIndex = regex.lastIndex //data property of a RegExp instance specifies the index at which to start the next match.
            // console.log(`Match: ${heading} Start Index: ${headingStartIndex} End Index: ${headingEndIndex}`);

            // method contains the full matched string in match[0] and the captured groups in subsequent elements (like match[1], match[2], etc.), but only if your regular expression includes capturing groups (using parentheses ()).
            //? Why this: 
            //! Inorder to get the content heading we created in the last match we need to find the start of the next match which is match.index
            if (lastSection)  // Here we are saying did we have a match last time, yes, find content
            {   
                const content = this.markdownContent.slice(lastIndex, headingStartIndex).trim();
                lastSection.content = content; //cache in the previous section
                sections.push(lastSection);
                
            }
            lastSection = {
                heading: heading,
                content: '',
            }
            lastIndex = headingEndIndex;
        }
        // //After the loop, we still need to capture the content after the last heading
        if(lastSection)
        {
            const content = this.markdownContent.slice(lastIndex).trim();
            lastSection.content = content;
            sections.push(lastSection);
        }
        return sections 
    }
	findandRemove(options) {}
	translateToPlaintext() {
		return markdownToTxt(this.markdownContent);
	}

	//options class
}
