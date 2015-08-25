var primitives = require('./primitives.js');
var operators  = require('./operators.js');

var System  = require('./System.js');
var Numeral = primitives.Numeral;

var Addition       = operators.Addition;
var Subtraction    = operators.Subtraction;
var Multiplication = operators.Multiplication;
var Division       = operators.Division;
var GreaterOrEqual = operators.GreaterOrEqual;
var LowerOrEqual   = operators.LowerOrEqual;
var Equality       = operators.Equality;

var Constrained = {
	// System of constraints
	System: System,

	// Expression operators
	plus: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new Addition(expression1, expression2);
	},

	minus: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new Subtraction(expression1, expression2);
	},

	times: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new Multiplication(expression1, expression2);
	},

	dividedBy: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new Division(expression1, expression2);
	},

	// Constraint generators
	greaterThan: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new GreaterOrEqual(expression1, expression2, strength, weight);
	},

	lowerThan: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new LowerOrEqual(expression1, expression2, strength, weight);
	},

	equals: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new Numeral(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new Numeral(expression2); }
		return new Equality(expression1, expression2, strength, weight);
	}
};

// window within a browser, global within node
var root;
if (typeof(window) !== 'undefined') {
	root = window;
} else if (typeof(global) !== 'undefined') {
	root = global;
} else {
	console.warn('[TINA] Your environment might not support TINA.');
	root = this;
}

module.exports = root.Constrained = Constrained;