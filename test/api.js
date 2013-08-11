var assert = require('assert');
var Sifter = require('../sifter.js');

describe('Sifter', function() {

	describe('#tokenize()', function() {
		var sifter, tokens;

		it('should return an empty array when given an empty string', function() {
			var sifter = new Sifter([]);
			var tokens = sifter.tokenize('');
			assert.equal(tokens.length, 0);
		});

		it('should return an array', function() {
			var sifter = new Sifter([]);
			var tokens = sifter.tokenize('hello world');
			assert.equal(Array.isArray(tokens), true);
		});

		it('should split string by spaces', function() {
			var sifter = new Sifter([]);
			var tokens = sifter.tokenize('hello world');
			assert.equal(tokens.length, 2);
		});

		describe('returned tokens', function() {
			before(function() {
				sifter = new Sifter([]);
				tokens = sifter.tokenize('hello world');
			});
			describe('"string" property', function() {
				it('should exist', function() {
					assert.notEqual(typeof tokens[0].string, 'undefined');
				});
				it('should be a string', function() {
					assert.equal(typeof tokens[0].string, 'string');
				});
				it('should be valid', function() {
					assert.equal(tokens[0].string, 'hello');
					assert.equal(tokens[1].string, 'world');
				});
			});
			describe('"regex" property', function() {
				it('should exist', function() {
					assert.notEqual(typeof tokens[0].regex, 'undefined');
				});
				it('should be a RegExp object', function() {
					assert.equal(tokens[0].regex instanceof RegExp, true);
				});
				it('should ignore case', function() {
					assert.equal(tokens[0].regex.test('HelLO'), true);
					assert.equal(tokens[1].regex.test('wORLD'), true);
				});
				it('should not be too greedy', function() {
					assert.equal(tokens[0].regex.test('afawfaf'), false);
				});
				it('should match international characters', function() {
					assert.equal(tokens[0].regex.test('hellö'), true);
					assert.equal(tokens[1].regex.test('wÕrld'), true);
				});
			});
		});

	});

	describe('#search()', function() {

		it('should not throw if an element does not contain search field', function() {
			assert.doesNotThrow(function() {
				var sifter = new Sifter([{field: 'a'}, {}]);
				var result = sifter.search('hello', {fields: ['field']});
			});
		});

		describe('returned results', function() {
			var sifter, options, result, result_empty;

			before(function() {
				sifter = new Sifter([
					{title: 'Matterhorn', location: 'Switzerland', continent: 'Europe'},
					{title: 'Eiger', location: 'Switzerland', continent: 'Europe'},
					{title: 'Everest', location: 'Nepal', continent: 'Asia'},
					{title: 'Gannett', location: 'Wyoming', continent: 'North America'},
					{title: 'Denali', location: 'Alaska', continent: 'North America'}
				]);

				options = {limit: 1, fields: ['title', 'location', 'continent']};
				result = sifter.search('switzerland europe', options);
				result_empty = sifter.search('awawfawfawf', options);
			});

			it('should not vary when using an array vs a hash as a data source', function() {
				var sifter_hash = new Sifter({
					'a': {title: 'Matterhorn', location: 'Switzerland', continent: 'Europe'},
					'b': {title: 'Eiger', location: 'Switzerland', continent: 'Europe'},
					'c': {title: 'Everest', location: 'Nepal', continent: 'Asia'},
					'd': {title: 'Gannett', location: 'Wyoming', continent: 'North America'},
					'e': {title: 'Denali', location: 'Alaska', continent: 'North America'}
				});
				var result_hash = sifter.search('switzerland europe', options);
				assert.deepEqual(result_hash, result);
			});

			describe('"items" array', function() {
				it('should be an array', function() {
					assert.equal(Array.isArray(result.items), true);
					assert.equal(Array.isArray(result_empty.items), true);
				});
				it('should not have a length that exceeds "limit" option', function() {
					assert.equal(result.items.length > options.limit, false);
				});
				it('should not contain any items with a score of zero', function() {
					for (var i = 0, n = result.items.length; i < n; i++) {
						assert.notEqual(result.items[i].score, 0);
					}
				});
				it('should be empty when no results match', function() {
					assert.equal(result_empty.items.length , 0);
				});

				describe('elements', function() {
					it('should be objects', function() {
						assert.equal(typeof result.items[0], 'object');
						assert.equal(Array.isArray(result.items[0]), false);
					});
					describe('"score" property', function() {
						it('should exist', function() {
							assert.notEqual(typeof result.items[0].score, 'undefined');
						});
						it('should be a number', function() {
							assert.equal(typeof result.items[0].score, 'number');
						});
					});
					describe('"id" property', function() {
						it('should exist', function() {
							assert.notEqual(typeof result.items[0].id, 'undefined');
						});
					});
				});
			});

			describe('"options"', function() {
				it('should match original search options', function() {
					assert.deepEqual(result.options, options);
				});
			});

			describe('"tokens"', function() {
				it('should be an array', function() {
					assert.equal(Array.isArray(result.tokens), true);
				});
				describe('elements', function() {
					it('should be a object', function() {
						assert.equal(typeof result.tokens[0], 'object');
						assert.equal(Array.isArray(result.tokens[0]), false);
					});
					describe('"string" property', function() {
						it('should exist', function() {
							assert.notEqual(typeof result.tokens[0].string, 'undefined');
						});
						it('should be a string', function() {
							assert.equal(typeof result.tokens[0].string, 'string');
						});
						it('should be valid', function() {
							assert.equal(result.tokens[0].string, 'switzerland');
							assert.equal(result.tokens[1].string, 'europe');
						});
					});
					describe('"regex" property', function() {
						it('should exist', function() {
							assert.notEqual(typeof result.tokens[0].regex, 'undefined');
						});
						it('should be a RegExp object', function() {
							assert.equal(result.tokens[0].regex instanceof RegExp, true);
						});
					});
				});
			});

			describe('"query"', function() {
				it('should match original query', function() {
					assert.equal(result.query, 'switzerland europe');
				});
			});

			describe('"total"', function() {
				it('should be an integer', function() {
					assert.equal(typeof result.total, 'number');
					assert.equal(Math.floor(result.total), Math.ceil(result.total));
				});
				it('should be valid', function() {
					assert.equal(result.total, 2);
					assert.equal(result_empty.total, 0);
				});
			});

		});

	});
});