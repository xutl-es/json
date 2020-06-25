import { describe, it, before } from '@xutl/test';
import assert from 'assert';
import { promises as fs, unlinkSync } from 'fs';

import XJSON from '../';

describe('JSON', () => {
	let data: any;
	it('can read', async () => {
		data = await XJSON.read(`${__dirname}/data.json`);
		assert(data);
		assert.deepStrictEqual(Object.keys(data), ['a', 'b', 'c', 'd', 'e', 'f']);
	});
	it('can readSync', () => {
		const actual = XJSON.readSync(`${__dirname}/data.json`);
		assert.deepStrictEqual(actual, data);
	});
	it('can stringify', () => {
		const actual = JSON.parse(XJSON.stringify(data));
		assert.deepStrictEqual(actual, data);
	});
	it('can stringify (no indent)', () => {
		const text = XJSON.stringify(data).split(/\r?\n/);
		assert.equal(text.length, 1);
	});
	it('can stringify (indent number)', () => {
		const actual = XJSON.stringify(data, undefined, 2);
		const expected = JSON.stringify(data, undefined, 2);
		assert.equal(actual, expected);
	});
	it('can stringify (indent tab string)', () => {
		const actual = XJSON.stringify(data, undefined, '\t');
		const expected = JSON.stringify(data, undefined, '\t');
		assert.equal(actual, expected);
	});
	it('can stringify (indent space string)', () => {
		const actual = XJSON.stringify(data, undefined, '  ');
		const expected = JSON.stringify(data, undefined, '  ');
		assert.equal(actual, expected);
	});
	it('can write', async () => {
		await XJSON.write(`${__dirname}/data-x.json`, data, { whitespace: '\t' });
		const actual = await XJSON.read(`${__dirname}/data-x.json`);
		await fs.unlink(`${__dirname}/data-x.json`);
		assert.deepStrictEqual(actual, data);
	});
	it('can writeSync', () => {
		XJSON.writeSync(`${__dirname}/data-x.json`, data, { whitespace: '\t' });
		const actual = XJSON.readSync(`${__dirname}/data-x.json`);
		unlinkSync(`${__dirname}/data-x.json`);
		assert.deepStrictEqual(actual, data);
	});
});
