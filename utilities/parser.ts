import markdownToTxt from "markdown-to-txt";
import {Notice} from 'obsidian';

interface Rule {
	regPattern: RegExp;
	description: string;
}

enum StartingHeaderVars {
	Topics = "Topics Covered",
	Synopsis = "Synopsis",
	TableContent = "Table of Contents",
	LearningObj = "Learning Objectives",
}

export interface Section {
	heading: string;
	content: string; //lower heading or strings
}


export default class Parser {
	rules: Rule[];
	options: Object;
	markdownContent: string;
	constructor(content: string) {
		this.rules = [
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

	// TODO: Consider ChatGPT Suggestions
/*
  1. **Avoid using a Map if order isn't necessary**:
     - You might not need a Map if the order of the headings doesn't matter. 
     - Consider using a plain object or a Set, which could be more efficient depending on your needs.

  2. **Combine the while loop and filtering logic**:
     - Instead of using a separate function to filter headings, 
     - Perform the filtering directly inside the loop. This removes an extra iteration over the Map and makes the code more efficient.

  3. **Use `for...of` to iterate over `this.markdownContent`**:
     - Regular expressions with `exec()` can be verbose, and manually tracking the last index can introduce bugs.
     - Using `for...of` with `match` will allow cleaner, more readable code.

  4. **Optimize Regular Expression Matching**:
     - Avoid repeatedly applying the regex. Process content in chunks to minimize unnecessary operations.
     - Also, consider whether you need all matches or if you can limit processing to valid sections only.
*/


	getHeadings() {
		const sections: Map<string,Section> = new Map();
		let lastSection: Section | null = null;
		//?This allows us to create substrings that still match the regex expression
		let match: RegExpExecArray | null;

		const regex = /#{1,6}\s?([^\n]+)/g; //regex to match all headings of all levels
		let lastIndex = 0; //To track the where to start the next

		while ((match = regex.exec(this.markdownContent)) !== null) 
		{
			const heading = match[1]; // Heading Text will be the full heading
			const headingStartIndex = match.index;
			const headingEndIndex = regex.lastIndex; //data property of a RegExp instance specifies the index at which to start the next match.
			// method contains the full matched string in match[0] and the captured groups in subsequent elements (like match[1], match[2], etc.), but only if your regular expression includes capturing groups (using parentheses ()).
			//? Why this:
			//! Inorder to get the content heading we created in the last match we need to find the start of the next match which is match.index
			if (lastSection) {
				// Here we are saying did we have a match last time, yes, find content
				const content = this.markdownContent
					.slice(lastIndex, headingStartIndex)
					.trim();
				lastSection.content = content; //cache in the previous section
				sections.set(lastSection.heading,lastSection);
			}
			lastSection = {
				heading: heading,
				content: "",
			};
			lastIndex = headingEndIndex;
		
		}
		//After the loop, we still need to capture the content after the last heading
		if (lastSection) {
			const content = this.markdownContent.slice(lastIndex).trim();
			lastSection.content = content;
			sections.set(lastSection.heading, lastSection);
		}
		const filterHeadings = (sections:Map<string,Section>):Map<string,Section>|null => {
			  // Iterating over the Map correctly

			let startingFound = false;
			for (const [key, value] of sections) {
				const{heading} = value;
				// console.log(typeof key); // The type of the key (usually 'string' or whatever the key type is)
				// console.log(typeof value); // The type of the value (should be 'object' for Section if that's what it is)
		
				//loop through 
				if(startingFound)
				{
					//We have found the 
					break;
				}
				else
				{
					for(const template_heading of Object.values(StartingHeaderVars))
					{
						const normalizedHeading = heading.toLowerCase();
						const normalizedTemplateHeading = template_heading.toLowerCase();
						//Exact Match
						if(normalizedHeading === normalizedTemplateHeading)
						{
							startingFound = true;
							break;
						}
						else if(normalizedHeading.includes(normalizedTemplateHeading))
						{
							//console.log(`Partial Match Found:${normalizedHeading}`)
							startingFound = true;	
							break;
						}
						else
						{
							sections.delete(key);
							//console.log(`No heading found for ${heading} flag: ${startingFound}`);
						}
					}
				}
			}
			return sections.size !== 0 ? sections : null;
		}
		return filterHeadings(new Map(sections))?? sections;
	}
    getContent(boundaries:any):string {

		console.log(boundaries);
		//Todo: Validate the case where start and end are the same 
        //if they are the same then we get that content up until the next heading. Which is a different regex
		const regex = new RegExp(
			`(^|\\n)(#{1,6}\\s*)?${boundaries.start}([\\s\\S]*?)${boundaries.end}([\\s\\S]*?)(?=\\n#{1,6}|$)`,
			"i"
        );
        let parsedText:string = '';
		let extractedContent = this.markdownContent.match(regex);
		if (extractedContent) {
        	parsedText = extractedContent[0];
		} else {
		  	//? Else grab the whole note
			new Notice("No matching section found");
			return;
		}
		//Validate the options object 
        this.rules.forEach(rule => parsedText = parsedText.replace(rule.regPattern,""));
        return this.translateToPlaintext(parsedText);
    }
	translateToPlaintext(content:string) {
		return markdownToTxt(content);
	}
}
