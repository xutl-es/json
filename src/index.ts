const singleComment = Symbol('singleComment');
const multiComment = Symbol('multiComment');

const BUILTIN = JSON;

interface StripFunction {
	(string: string, start?: number, end?: number): string;
}
const stripWithoutWhitespace: StripFunction = () => '';
const stripWithWhitespace: StripFunction = (string: string, start?: number, end?: number) =>
	string.slice(start, end).replace(/\S/g, ' ');

const isEscaped = (jsonString: string, quotePosition: number) => {
	let index = quotePosition - 1;
	let backslashCount = 0;

	while (jsonString[index] === '\\') {
		index -= 1;
		backslashCount += 1;
	}

	return Boolean(backslashCount % 2);
};

export interface JSONReviver {
	(key: string | symbol, value: any): any;
}
export interface ParseOptions {
	whitespace?: boolean;
	reviver?: JSONReviver;
}

export const parse = (jsonString: string, options: ParseOptions | JSONReviver = {}): any => {
	if ('function' === typeof options) {
		options = { reviver: options };
	}
	const strip = (options.whitespace ?? true) === false ? stripWithoutWhitespace : stripWithWhitespace;

	let insideString: boolean = false;
	let insideComment: symbol | false = false;
	let offset = 0;
	let result = '';

	for (let i = 0; i < jsonString.length; i++) {
		const currentCharacter = jsonString[i];
		const nextCharacter = jsonString[i + 1];

		if (!insideComment && currentCharacter === '"') {
			const escaped = isEscaped(jsonString, i);
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentCharacter + nextCharacter === '//') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
			i++;
			insideComment = false;
			result += strip(jsonString, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentCharacter === '\n') {
			insideComment = false;
			result += strip(jsonString, offset, i);
			offset = i;
		} else if (!insideComment && currentCharacter + nextCharacter === '/*') {
			result += jsonString.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentCharacter + nextCharacter === '*/') {
			i++;
			insideComment = false;
			result += strip(jsonString, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	result += insideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset);
	return BUILTIN.parse(result, options.reviver);
};
export interface JSONReplacer {
	(this: any, key: string, value: any): null | number | string | boolean | object;
}
export interface StringifyOptions {
	whitespace?: string | number;
	replacer?: JSONReplacer | string[];
}
export const stringify = (
	data: any,
	options: StringifyOptions | JSONReplacer | string[] = {},
	whitespace?: number | string,
): string => {
	if ('function' === typeof options || Array.isArray(options)) {
		options = { replacer: options };
	}
	options.whitespace = options.whitespace ?? whitespace;
	return BUILTIN.stringify(data, options.replacer as JSONReplacer, options.whitespace);
};
import fs from 'fs';

export const read = async (filename: string, options: ParseOptions = {}): Promise<any> => {
	const text = await fs.promises.readFile(filename, 'utf-8');
	const json = parse(text, options);
	return json;
};
export const write = async (filename: string, data: any, options: StringifyOptions = {}): Promise<void> => {
	options = Object.assign({}, options);
	options.whitespace = options.whitespace ?? '  ';
	const text = stringify(data, options);
	await fs.promises.writeFile(filename, text);
};

export const readSync = (filename: string, options: ParseOptions = {}): any => {
	const text = fs.readFileSync(filename, 'utf-8');
	const json = parse(text, options);
	return json;
};
export const writeSync = (filename: string, data: any, options: StringifyOptions = {}): void => {
	options = Object.assign({}, options);
	options.whitespace = options.whitespace ?? '  ';
	const text = stringify(data, options);
	fs.writeFileSync(filename, text);
};

const Default = Object.freeze({
	parse,
	stringify,
	read,
	write,
	readSync,
	writeSync,
});
export default Default;
