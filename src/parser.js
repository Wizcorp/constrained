var systemOperators  = require('./operators.js');
var systemPrimitives = require('./primitives.js');

var Addition       = systemOperators.Addition;
var Subtraction    = systemOperators.Subtraction;
var Multiplication = systemOperators.Multiplication;
var Division       = systemOperators.Division;
var GreaterOrEqual = systemOperators.GreaterOrEqual;
var LowerOrEqual   = systemOperators.LowerOrEqual;
var Equality       = systemOperators.Equality;

var Numeral = systemPrimitives.Numeral;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @class  Expression Parser
 * @author Cedric Stoquer
 *
 * @param {String} str - string buffer
 *
 *
 * Simple expression parser with the following features:
 * - parse variables, integer and float numbers, string constants, unary and binary operators,
 *   parenthesis, predefined functions with any number of parameters.
 * - correctly resolve operator precedence.
 *
 * Originaly designed to parse BASIC programs
 */
function Parser(str) {
	this.str                = str;
	this.parameterMap       = null;
	this.onParameterMissing = null;
}

function parseExpression(str, parameterMap, onParameterMissing) {
	var parser = new Parser(str);
	parser.parameterMap       = parameterMap;
	parser.onParameterMissing = onParameterMissing;
	return parser.parseExpression();
}

module.exports = parseExpression;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

var operators = [
	// { id: ';',   precedence: 0 },
	// { id: 'AND', precedence: 1 },
	// { id: 'OR',  precedence: 1 },
	// { id: 'XOR', precedence: 1 },
	// { id: '<>',  precedence: 2 },
	{ id: '>=',  precedence: 2, class: GreaterOrEqual },
	{ id: '<=',  precedence: 2, class: LowerOrEqual },
	{ id: '=',   precedence: 2, class: Equality },
	// { id: '>',   precedence: 2 },
	// { id: '<',   precedence: 2 },
	{ id: '+',   precedence: 3, class: Addition },
	{ id: '-',   precedence: 3, class: Subtraction },
	// { id: '\\',  precedence: 4 },
	// { id: 'MOD', precedence: 4 },
	{ id: '*',   precedence: 4, class: Multiplication },
	{ id: '/',   precedence: 4, class: Division }
];

var unaryOperators = [
	// { id: '!' }
];

var functions = [
	// { id: 'ABS',      parameters: 1 },
	// { id: 'ATN',      parameters: 1 },
	// { id: 'CIN',      parameters: 1 },
	// { id: 'COS',      parameters: 1 },
	// { id: 'EXP',      parameters: 1 },
	// { id: 'INT',      parameters: 1 },
	// { id: 'LOG10',    parameters: 1 },
	// { id: 'LOG',      parameters: 1 },
	// { id: 'MAX',      parameters: '*' },
	// { id: 'MIN',      parameters: '*' },
	// { id: 'PI',       parameters: 0 },
	// { id: 'ROUND',    parameters: [1, 2] },
	// { id: 'SGN',      parameters: 1 },
	// { id: 'SIN',      parameters: 1 },
	// { id: 'SQR',      parameters: 1 },
	// { id: 'TAN',      parameters: 1 }
];

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

Parser.prototype.removeWhiteSpace = function () {
	var t = this;
	// while (t.str[0] === ' ' || t.str[0] === '\n') t.str = t.str.substring(1);
	t.str = t.str.replace(' ', '');
	t.str = t.str.replace('\n', '');
};

//███████████████████████████████████████████████████████████████████████████████
//██▄░▄▄▄▀███████████████████████████████▀████▄░██████████████████████▄██████████
//███░███░█▀▄▄▄▄▀██▄░▀▄▄▄█▀▄▄▄▄▀█▄░▀▄▄▀█▄░▄▄▄██░▀▄▄▀██▀▄▄▄▄▀█▀▄▄▄▄░█▄▄░███▀▄▄▄▄░█
//███░▄▄▄██▀▄▄▄▄░███░█████░▄▄▄▄▄██░███░██░█████░███░██░▄▄▄▄▄██▄▄▄▄▀███░████▄▄▄▄▀█
//██▀░▀████▄▀▀▀▄░▀█▀░▀▀▀██▄▀▀▀▀▀█▀░▀█▀░▀█▄▀▀▀▄▀░▀█▀░▀█▄▀▀▀▀▀█░▀▀▀▀▄█▀▀░▀▀█░▀▀▀▀▄█
//███████████████████████████████████████████████████████████████████████████████

/** @method parseParenthesis
 */
Parser.prototype.parseParenthesis = function () {
	var t = this;
	if (t.str[0] !== '(') throw new Error('An opening parenthesis is missing.');
	//consume first parenthesis
	t.str = t.str.substring(1);
	var res = '';
	var stackParenthesis = 0;
	while (!(t.str[0] === ')' && stackParenthesis === 0)) {
		if (t.str[0] === '(') stackParenthesis++;
		if (t.str[0] === ')') stackParenthesis--;
		if (stackParenthesis < 0) throw new Error('Too much closing parenthesis.');
		res += t.str[0];
		t.str = t.str.substring(1);
		if (t.str === '') throw new Error('Parenthesis expression doesn\'t resolve');
	}
	// consume last parenthesis
	t.str = t.str.substring(1);

	// parse expression inside parenthesis
	res = parseExpression(res, t.parameterMap, t.onParameterMissing);
	// res = {
	// 	type: 'parenthesis',
	// 	arg: res
	// };
	return res;
};

//█████████████████████████████████████████
//██▄░▄████████▄█████████████▀█████████████
//███░███████▄▄░████▀▄▄▄▄░██▄░▄▄▄██████████
//███░███▀█████░█████▄▄▄▄▀███░█████████████
//██▀░▀▀▀░███▀▀░▀▀██░▀▀▀▀▄███▄▀▀▀▄█████████
//█████████████████████████████████████████

/** @method getParenthesisList
 * Parse a list of comma separated arguments
 */
Parser.prototype.getParenthesisList = function () {
	var t = this;
	// parse parenthesis content: (expr, expr, ...)
	if (t.str[0] !== '(') throw new Error('An opening parenthesis is missing.');
	// consume first "("
	t.str = t.str.substring(1);
	var args = [];
	var arg = '';
	var stackParenthesis = 0;
	while (!(t.str[0] === ')' && stackParenthesis === 0)) {
		if (t.str[0] === '(') stackParenthesis++;
		if (t.str[0] === ')') stackParenthesis--;
		if (stackParenthesis < 0) throw new Error('Too much closing parenthesis.');
		if (t.str[0] === ',' && stackParenthesis === 0) {
			arg = parseExpression(arg);
			args.push(arg);
			arg = '';
		} else {
			arg += t.str[0];
		}
		t.str = t.str.substring(1);
		if (t.str === '') throw new Error('Parenthesis expression doesn\'t resolve');
	}
	// push last parameter
	arg = parseExpression(arg);
	args.push(arg);
	// consume last ")"
	t.str = t.str.substring(1);
	return args;
};

//█████████████████████████████████████████████████
//██▀▄▄▄▀░███▀█████████████████▄███████████████████
//██▄▀▀▀▀███▄░▄▄▄███▄░▀▄▄▄███▄▄░████▄░▀▄▄▀██▀▄▄▄▀░▄
//███████░███░███████░█████████░█████░███░██░████░█
//██░▄▀▀▀▄███▄▀▀▀▄██▀░▀▀▀████▀▀░▀▀██▀░▀█▀░▀█▄▀▀▀▄░█
//███████████████████████████████████████████▀▀▀▀▄█

/** @method parseString
 */
Parser.prototype.parseString = function () {
	var t = this;
	var res = '';
	if (t.str[0] !== '"') throw new Error('An opening quote is missing.');
	// consume first double quote
	t.str = t.str.substring(1);
	while (t.str[0] !== '"') {
		res += t.str[0];
		t.str = t.str.substring(1);
		if (t.str === '') throw new Error('Closing quote not found.');
	}
	// consume last double quote
	t.str = t.str.substring(1);
	return { type: 'string', value: res };
};

//██████████████████████████████████████████████████
//██▄░░██▄░▄████████████████▄░██████████████████████
//███░█░██░██▄░██▄░█▄░▀▄▀▀▄▀█░▀▄▄▄▀██▀▄▄▄▄▀██▄░▀▄▄▄█
//███░██░█░███░███░██░██░██░█░████░██░▄▄▄▄▄███░█████
//██▀░▀██░░███▄▀▀▄░▀▀░▀█░▀█░▀░▄▀▀▀▄██▄▀▀▀▀▀██▀░▀▀▀██
//██████████████████████████████████████████████████

/** @method parseNumber
 */
Parser.prototype.parseNumber = function () {
	var t    = this;
	var type = 'int';
	var res  = '';

	// check for a negative number
	if (t.str[0] === '-') {
		res   = '-';
		t.str = t.str.substring(1);
		// t.removeWhiteSpace();
	}

	if (t.str === '') throw new Error('End of line before number.');

	if (t.str[0].search(/[0-9]/) === -1) throw new Error('Not a digit character');
	while (t.str[0].search(/[0-9]/) === 0) {
		res += t.str[0];
		t.str = t.str.substring(1);
		if (t.str === '') break;
	}

	// check for a decimal point
	if (t.str[0] === '.') {
		type = 'float';
		res += '.';
		t.str = t.str.substring(1);
		// continue to consume decimal digits
		while (t.str[0].search(/[0-9]/) === 0) {
			res += t.str[0];
			t.str = t.str.substring(1);
			if (t.str === '') break;
		}
	}

	// var value = Number(res);
	return new Numeral(parseFloat(res));
};

//█████████████████████████████████████████████████████████████████
//██▄░▄▄▄░███████████████████████████▀█████████▄███████████████████
//███░▀░████▄░██▄░██▄░▀▄▄▀██▀▄▄▄▀░██▄░▄▄▄████▄▄░████▀▄▄▄▄▀██▄░▀▄▄▀█
//███░█▄█████░███░███░███░██░████████░█████████░████░████░███░███░█
//██▀░▀██████▄▀▀▄░▀█▀░▀█▀░▀█▄▀▀▀▀▄███▄▀▀▀▄███▀▀░▀▀██▄▀▀▀▀▄██▀░▀█▀░▀
//█████████████████████████████████████████████████████████████████

/** @method parseFunction
 * @desc   get function parameters content
 * @param {Object} func - function definition object
 *
 * A function have the following syntax:
 * - without parameters                : FUNC
 * - parameters defined in parenthesis : FUNC(X)
 * - and comma separated               : FUNC(X1, X2, X3, ...)
 */
Parser.prototype.parseFunction = function (func) {
	var t = this;
	// function name has already been consumed.
	var res = { type: 'function', id: func.id };
	var parameters = func.parameters;
	// parameters can be:
	// 0 -> no parameters, thus no parenthesis
	if (parameters === 0) return res;

	// int   -> a fixed number of parameter
	// array -> various number of parameters is possible
	// '*'   -> number of parameters is free (but at least 1)

	// special case: if function can have 0 or more parameters,
	// then if we have 0 parameters, there are no parenthesis
	if (Array.isArray(parameters) && parameters.indexOf(0) !== -1 && t.str[0] !== '(') {
		return res;
	}

	var args = t.getParenthesisList();

	// check parameters count
	var count = args.length;
	// there are no parameter (but there are brackets)
	if (count === 0) throw new Error('There is no arguments inside function brackets.');
	// number of parameters is incorrect
	if (!isNaN(parameters) && count !== parameters) throw new Error('Incorrect number of arguments.');
	// check when various number of parameters are possible
	if (Array.isArray(parameters)) {
		var ok = false;
		for (var i = 0, len = parameters.length; i < len; i++) {
			if (count === parameters[i]) {
				ok = true;
				break;
			}
		}
		if (!ok) throw new Error('Incorrect number of arguments.');
	}

	// add parameters in result
	res.args = args;
	return res;
};


//█████████████████████████████████████████████████████████████████
//█▄░▄██▄░▄████████████████████▄███████████▄░█████████▄░███████████
//██▄▀██▀▄██▀▄▄▄▄▀██▄░▀▄▄▄███▄▄░████▀▄▄▄▄▀██░▀▄▄▄▀█████░████▀▄▄▄▄▀█
//███░██░███▀▄▄▄▄░███░█████████░████▀▄▄▄▄░██░████░█████░████░▄▄▄▄▄█
//████░░████▄▀▀▀▄░▀█▀░▀▀▀████▀▀░▀▀██▄▀▀▀▄░▀▀░▄▀▀▀▄███▀▀░▀▀██▄▀▀▀▀▀█
//█████████████████████████████████████████████████████████████████

/** @method parseVariable
 */
Parser.prototype.parseVariable = function () {
	var t = this;
	var res = '';
	// default type for locomotive basic are float
	var varType = 'float';

	// first character must be a letter
	if (t.str[0].search(/[A-Za-z]/) === -1) throw new Error('Invalid variable name');
	res += t.str[0];
	t.str = t.str.substring(1);

	// following character could be letters or numbers
	while (t.str !== '' && t.str[0].search(/[A-Za-z0-9]/) !== -1) {
		res += t.str[0];
		t.str = t.str.substring(1);
	}

	// variable name can ends with one of these special characters : $ % !
	if (t.str[0] === '$' || t.str[0] === '%' || t.str[0] === '!') {
		res += t.str[0];
		switch (t.str[0]) {
		case '$': varType = 'string'; break;
		case '%': varType = 'int'; break;
		case '!': varType = 'float'; break;
		}
		t.str = t.str.substring(1);
	}

	/*res = {
		type: 'variable',
		varType: varType,
		id: res,
	};

	// if variable is an array, following character is a opening bracket
	if (t.str[0] === '(') {
		// extract parenthesis content
		res.indexes = t.getParenthesisList();
		// set variable as an array
		res.isArray = true;
	}

	return res;*/

	var parameter = t.parameterMap[res];
	return (parameter === undefined) ? t.onParameterMissing(res) : parameter;
};

//██████████████████████████████████████████████████████████████████████████
//██▄░░██▄░▄████████████████▀██████▀▄▄▄▀██▄░████████▄█████████████████▀█████
//███░█░██░██▀▄▄▄▄▀█▄░██░▄█▄░▄▄▄██░█████░██░▀▄▄▄▀█▄▄▄░█▀▄▄▄▄▀█▀▄▄▄▀░█▄░▄▄▄██
//███░██░█░██░▄▄▄▄▄███░░████░█████░█████░██░████░████░█░▄▄▄▄▄█░███████░█████
//██▀░▀██░░██▄▀▀▀▀▀█▀░██░▀██▄▀▀▀▄██▄▀▀▀▄██▀░▄▀▀▀▄████░█▄▀▀▀▀▀█▄▀▀▀▀▄██▄▀▀▀▄█
//████████████████████████████████████████████████▀▀▀▄██████████████████████

/** @method getNextObject
 *
 * next object should be one of these:
 *  ~  (e)     an expression in parenthesis
 *  ~  -1      a number (possibly negative). NOTA: no whitespace allowed between "-" operator and the number
 *  ~  -e      unary operator applied to an expression
 *  ~  NOT e   unary boolean operator NOT
 *  ~  F(e,e)  a function (function names are known, see table)
 *  ~  X       a variable name
 */
Parser.prototype.getNextObject = function () {
	var t = this;
	// t.removeWhiteSpace();

	if (t.str === '') return null;

	// check if next object is an expression in parenthesis
	if (t.str[0] === '(') return t.parseParenthesis();

	// check if next object is a string
	if (t.str[0] === '"') return t.parseString();

	// TODO: hexadecimal number

	// check for unary '-' operator (not with number)
	if (t.str[0] === '-' && t.str[1].search(/[0-9]/) === -1) {
		// consume '-'
		t.str = t.str.substring(1);
		return new Multiplication(new Numeral(-1), t.getNextObject());
		// return { type: 'unaryOp', id: '-', arg: t.getNextObject() };
	}

	// check for unary operators
	var i;
	for (i = 0; i < unaryOperators.length; i++) {
		var operatorId = unaryOperators[i].id;
		var strLen = operatorId.length;
		if (t.str.substring(0, strLen) === operatorId) {
			// consume operator
			t.str = t.str.substring(strLen);
			return new unaryOperators[i].class(t.getNextObject());
			// return { type: 'unaryOp', id: operatorId, arg: t.getNextObject() };
		}
	}

	// check if next object is a number
	if (t.str[0].search(/[\-0-9]/) !== -1) return t.parseNumber();

	// check if next object is a function
	for (i = 0; i < functions.length; i++) {
		var fLen = functions[i].id.length;
		if (t.str.substring(0, fLen) === functions[i].id) {
			// consume funtion name
			t.str = t.str.substring(fLen);
			// get parameters and return function object
			return t.parseFunction(functions[i]);
		}
	}

	// check if next object is a variable name
	if (t.str[0].search(/[A-Za-z]/) !== -1) return t.parseVariable();

	// not recognized object
	return null;
};

//██████████████████████████████████████████████████████████████████████████████████████████
//██▄░░██▄░▄████████████████▀██████▀▄▄▄▀████████████████████████████████▀███████████████████
//███░█░██░██▀▄▄▄▄▀█▄░██░▄█▄░▄▄▄██░█████░█▄░▀▄▄▀█▀▄▄▄▄▀█▄░▀▄▄▄█▀▄▄▄▄▀██▄░▄▄▄██▀▄▄▄▄▀█▄░▀▄▄▄█
//███░██░█░██░▄▄▄▄▄███░░████░█████░█████░██░███░█░▄▄▄▄▄██░█████▀▄▄▄▄░███░█████░████░██░█████
//██▀░▀██░░██▄▀▀▀▀▀█▀░██░▀██▄▀▀▀▄██▄▀▀▀▄███░▀▀▀▄█▄▀▀▀▀▀█▀░▀▀▀██▄▀▀▀▄░▀██▄▀▀▀▄█▄▀▀▀▀▄█▀░▀▀▀██
//████████████████████████████████████████▀░▀███████████████████████████████████████████████

/** @method getNextOperator
 *
 * next token is an operator in the list
 */
Parser.prototype.getNextOperator = function () {
	var t = this;
	// t.removeWhiteSpace();

	// check end of stream
	if (t.str === '') return null;

	// check each of operators
	for (var i = 0; i < operators.length; i++) {
		var oLen = operators[i].id.length;
		if (t.str.substring(0, oLen) === operators[i].id) {
			// consume token
			t.str = t.str.substring(oLen);
			// return operator
			return operators[i];
		}
	}

	// next element is not a token
	return null;
};

//████████████████████████████████████████████████████████████████████████
//█████████████████████████████████████████████████████▄██████████████████
//██▀▄▄▄▄▀█▄░██░▄█▄░▀▄▄▀█▄░▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▄░█▀▄▄▄▄░█▄▄░███▀▄▄▄▄▀█▄░▀▄▄▀██
//██░▄▄▄▄▄███░░████░███░██░█████░▄▄▄▄▄██▄▄▄▄▀██▄▄▄▄▀███░███░████░██░███░██
//██▄▀▀▀▀▀█▀░██░▀██░▀▀▀▄█▀░▀▀▀██▄▀▀▀▀▀█░▀▀▀▀▄█░▀▀▀▀▄█▀▀░▀▀█▄▀▀▀▀▄█▀░▀█▀░▀█
//████████████████▀░▀█████████████████████████████████████████████████████

/** @method parseExpression
 *
 * next token is an operator in the list
 */
Parser.prototype.parseExpression = function () {
	this.removeWhiteSpace();

	// get all tokens
	var operator;
	var objects   = [];
	var operators = [];
	while (true) {
		objects.push(this.getNextObject());
		operator = this.getNextOperator();
		if (operator === null) break;
		operators.push(operator);
	}

	// parse expression
	var i = 0;
	while (operators.length > 0) {
		operator = operators[i];
		var lookahead = operators[i+1];
		if (!lookahead || operator.precedence >= lookahead.precedence) {
			// reducing object[i] operator[i] object[i+1]
			// var object = {
			// 	type: 'operator',
			// 	id:   operator.id,
			// 	arg1: objects[i],
			// 	arg2: objects[i+1]
			// };

			var object = new operator.class(objects[i], objects[i+1]);

			objects.splice(i, 2, object);
			operators.splice(i, 1);
			i = 0;
			continue;
		}
		i += 1;
	}
	return objects[0];
};


