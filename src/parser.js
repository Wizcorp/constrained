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

function StringBuffer(str) {
	this.str = str;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

function Parser() {
	this.buffer             = null;
	this.start              = 0;
	this.end                = 0;
	this.parameterMap       = null;
	this.onParameterMissing = null;
}


function parseExpression(str, parameterMap, onParameterMissing) {
	var parser = new Parser().fromString(str);
	parser.parameterMap       = parameterMap;
	parser.onParameterMissing = onParameterMissing;
	return parser.parseExpression();
}

module.exports = parseExpression;


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄

var operators = [
	{ id: '>=',  precedence: 2, class: GreaterOrEqual },
	{ id: '<=',  precedence: 2, class: LowerOrEqual },
	{ id: '=',   precedence: 2, class: Equality },
	{ id: '+',   precedence: 3, class: Addition },
	{ id: '-',   precedence: 3, class: Subtraction },
	{ id: '*',   precedence: 4, class: Multiplication },
	{ id: '/',   precedence: 4, class: Division }
];

var unaryOperators = [];
var functions = [];

//█████████████████████████████████████████████████████████████████████████████████████
//████████▀███████████▄███████████████████████▄░████████████████▀▀▀███▀▀▀██████████████
//█▀▄▄▄░█▄░▄▄██▄░▀▄▄█▄░███▄░▀▄▄▀██▀▄▄▄▀░▄██████░▀▄▄▄▀█▄░██▄░██▀░▀▀▀█▀░▀▀▀█▀▄▄▄▀█▄░▀▄▄▄█
//██▄▄▄▀██░█████░█████░████░███░██░████░███████░████░██░███░███░█████░████░▄▄▄▄██░█████
//█░▀▀▀▄██▄▀▀▄█▀░▀▀██▀░▀▀█▀░▀█▀░▀█▄▀▀▀▄░██████▀░▄▀▀▀▄██▄▀▀▄░▀█▀░▀▀▀█▀░▀▀▀█▄▀▀▀▀█▀░▀▀▀██
//█████████████████████████████████▀▀▀▀▄███████████████████████████████████████████████

Parser.prototype.fromString = function (str) {
	this.buffer = new StringBuffer(str);
	this.start  = 0;
	this.end    = str.length;
	return this;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Parser.prototype.copy = function (start, end) {
	var stringBuffer                = new Parser();
	stringBuffer.buffer             = this.buffer;
	stringBuffer.start              = start;
	stringBuffer.end                = end;
	stringBuffer.parameterMap       = this.parameterMap;
	stringBuffer.onParameterMissing = this.onParameterMissing;
	return stringBuffer;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Parser.prototype.removeWhiteSpace = function () {
	var t = this;
	while (t.buffer.str[t.start] === ' ' || t.buffer.str[t.start] === '\n') {
		t.start += 1;
	}
	return t;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Parser.prototype.isEmpty = function () {
	return this.start >= this.end;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Parser.prototype.isNextChar = function (c) {
	return this.buffer.str[this.start] === c;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Test if next character in string buffer is a number
 * this is equivalent of doing regex test /^[0-9]/ but faster
 */
Parser.prototype.isNextNumber = function (offset) {
	var charCode = this.buffer.str.charCodeAt(this.start + offset);
	return charCode >= 48 && charCode <= 57;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Test if next character in string buffer is an letter
 * this is equivalent of doing regex test /^[A-Za-z]/ but faster
 */
Parser.prototype.isNextLetter = function () {
	var charCode = this.buffer.str.charCodeAt(this.start);
	return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Parser.prototype.isNextAlphaNum = function () {
	var charCode = this.buffer.str.charCodeAt(this.start);
	return (charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** String comparison */
Parser.prototype.isNextString = function (str) {
	var t = this;
	var len = str.length;
	for (var i = 0; i < len; i++) {
		if (t.buffer.str[t.start + i] !== str[i]) return false;
	}
	return true;
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
	if (!t.isNextChar('(')) throw new Error('An opening parenthesis is missing.');
	//consume first parenthesis
	t.start += 1;

	var resStart = t.start;
	var resEnd   = t.start;

	var stackParenthesis = 0;
	while (!(t.isNextChar(')') && stackParenthesis === 0)) {
		if (t.isNextChar('(')) stackParenthesis++;
		if (t.isNextChar(')')) stackParenthesis--;
		if (stackParenthesis < 0) throw new Error('Too much closing parenthesis.');
		t.start += 1;
		resEnd  += 1;
		if (t.isEmpty()) throw new Error('Parenthesis expression doesn\'t resolve');
	}
	// consume last parenthesis
	t.start += 1;

	return t.copy(resStart, resEnd).parseExpression();
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
	if (!t.isNextChar('(')) throw new Error('An opening parenthesis is missing.');
	// consume first "("
	t.start += 1;

	var args = [];
	// var arg = '';
	var argStart = t.start;
	var argEnd   = t.start;
	var stackParenthesis = 0;
	while (!(t.isNextChar(')') && stackParenthesis === 0)) {
		if (t.isNextChar('(')) stackParenthesis++;
		if (t.isNextChar(')')) stackParenthesis--;
		if (stackParenthesis < 0) throw new Error('Too much closing parenthesis.');
		if (t.isNextChar(',') && stackParenthesis === 0) {
			// arg = parseExpression(arg);
			// arg = '';
			args.push(t.copy(argStart, argEnd).parseExpression());
			// consume comma
			t.start += 1;
			t.removeWhiteSpace();
			// reset arg boundaries
			argStart = t.start;
			argEnd   = t.start;
			continue;
		}
		argEnd  += 1;
		t.start += 1;
		if (t.isEmpty()) throw new Error('Parenthesis expression doesn\'t resolve');
	}
	// push last parameter
	args.push(t.copy(argStart, argEnd).parseExpression());
	// consume last ")"
	t.start += 1;
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
	if (!t.isNextChar('"')) throw new Error('An opening quote is missing.');
	// consume first double quote
	t.start += 1;
	while (!t.isNextChar('"')) {
		res += t.buffer.str[t.start];
		t.start += 1;
		if (t.isEmpty()) throw new Error('Closing quote not found.');
	}
	// consume last double quote
	t.start += 1;
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
	if (t.isNextChar('-')) {
		res   = '-';
		t.start += 1;
		t.removeWhiteSpace();
	}

	if (t.isEmpty()) throw new Error('End of line before number.');

	if (!t.isNextNumber(0)) throw new Error('Not a digit character');
	while (t.isNextNumber(0) && !t.isEmpty()) {
		res += t.buffer.str[t.start];
		t.start += 1;
		// if (t.isEmpty()) break;
	}

	// check for a decimal point
	if (t.isNextChar('.')) {
		type = 'float';
		res += '.';
		// consume dot
		t.start += 1;
		// continue to consume decimal digits
		while (t.isNextNumber(0) && !t.isEmpty()) {
			res += t.buffer.str[t.start];
			t.start += 1;
		}
	}

	// var value = Number(res);
	// return { type: type, value: value };
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
	if (Array.isArray(parameters) &&
		parameters.indexOf(0) !== -1 &&
		t.isNextChar('(')) return res;

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
 * PRE: first character must be a letter
 */
Parser.prototype.parseVariable = function () {
	var t = this;

	// default type for locomotive basic are float
	var varType = 'default';

	// consume first character (it must be a letter)
	var variableName = t.buffer.str[t.start];
	t.start += 1;

	// following character could be letters or numbers
	while (!t.isEmpty() && t.isNextAlphaNum()) {
		variableName += t.buffer.str[t.start];
		t.start += 1;
	}

	// variable name can ends with one of these special characters : $ % !
	if (t.isNextChar('$') || t.isNextChar('%') || t.isNextChar('!')) {
		variableName += t.buffer.str[t.start];
		switch (t.buffer.str[t.start]) {
			case '$': varType = 'string'; break;
			case '%': varType = 'int';    break;
			case '!': varType = 'float';  break;
		}
		t.str = t.str.substring(1);
	}

	var variable = {
		type: 'variable',
		varType: varType,
		id: variableName,
	};

	// if variable is an array, following character is a opening bracket
	if (t.isNextChar('(')) {
		// extract parenthesis content
		variable.args = t.getParenthesisList();
		// set variable as an array
		variable.isArray = true;
	}

	// return variable;

	var parameter = t.parameterMap[variableName];
	return (parameter === undefined) ? t.onParameterMissing(variableName) : parameter;
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
	t.removeWhiteSpace();

	if (t.isEmpty()) return null;

	// check if next object is an expression in parenthesis
	if (t.isNextChar('(')) return t.parseParenthesis();

	// check if next object is a string
	if (t.isNextChar('"')) return t.parseString();

	// TODO: hexadecimal number

	var isNextMinus = t.isNextChar('-');
	var arg;

	// check for unary '-' operator (not with number)
	// if (isNextMinus && t.buffer.str[t.start + 1].search(/[0-9]/) === -1) { // TODO
	if (isNextMinus && !t.isNextNumber(1)) {
		// consume '-'
		t.start += 1;

		// get argument
		arg = t.getNextObject();
		// return { type: 'unaryOp', id: '-', args: [arg] };
		return new Multiplication(new Numeral(-1), arg);
	}

	// check for unary operators
	var i;
	for (i = 0; i < unaryOperators.length; i++) {
		var operatorId = unaryOperators[i].id;
		if (t.isNextString(operatorId)) {
			// consume operator
			t.start += operatorId.length;
			// get argument
			arg = t.getNextObject();
			// return { type: 'unaryOp', id: operatorId, args: [arg] };
			return new unaryOperators[i].class(arg);
		}
	}

	// check if next object is a number
	if (t.isNextNumber(0) || isNextMinus) return t.parseNumber();

	// check if next object is a function
	for (i = 0; i < functions.length; i++) {
		if (t.isNextString(functions[i].id)) {
			// consume funtion name
			t.start += functions[i].id.length;
			// get parameters and return function object
			return t.parseFunction(functions[i]);
		}
	}

	// check if next object is a variable name
	if (t.isNextLetter()) return t.parseVariable();

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
	t.removeWhiteSpace();

	// check end of stream
	if (t.isEmpty()) return null;

	// check each of operators
	for (var i = 0; i < operators.length; i++) {
		if (t.isNextString(operators[i].id)) {
			// consume token
			t.start += operators[i].id.length;
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
	// get all tokens
	var objects   = [];
	var operators = [];
	var operator;
	while (true) {
		objects.push(this.getNextObject());
		operator = this.getNextOperator();
		if (operator === null) break;
		operators.push(operator);
	}

	// parse expression
	var i = 0;
	while (operators.length > 0) {
		operator  = operators[i];
		var lookahead = operators[i+1];
		if (!lookahead || operator.precedence >= lookahead.precedence) {
			// reducing object[i] operator[i] object[i+1]
			/*var object = {
				type: 'operator',
				id:   operator.id,
				args: [objects[i], objects[i+1]]
			};*/

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


