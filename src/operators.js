var cassowary  = require('cassowary');
var Expression = require('./Expression.js');

function Addition(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Addition.prototype = Object.create(Expression.prototype);
Addition.prototype.constructor = Addition;
Addition.prototype.construct = function () {
	var left  = this._left.construct();
	var right = this._right.construct();
	return left.plus(right);
};

function Subtraction(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Subtraction.prototype = Object.create(Expression.prototype);
Subtraction.prototype.constructor = Subtraction;
Subtraction.prototype.construct = function () {
	var left  = this._left.construct();
	var right = this._right.construct();
	return left.minus(right);
};

function Multiplication(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Multiplication.prototype = Object.create(Expression.prototype);
Multiplication.prototype.constructor = Multiplication;
Multiplication.prototype.construct = function () {
	var left  = this._left.construct();
	var right = this._right.construct();
	return left.times(right);
};

function Division(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Division.prototype = Object.create(Expression.prototype);
Division.prototype.constructor = Division;
Division.prototype.construct = function () {
	var left  = this._left.construct();
	var right = this._right.construct();
	return left.divide(right);
};

var constraintCount = 0;
function Constraint(expression1, expression2, strength, weight) {
	this._expression1 = expression1;
	this._expression2 = expression2;
	this._strength    = strength;
	this._weight      = weight;

	this._constraint = null;
	this._id = (constraintCount++).toString();

	this._registerToPrimitives();
}

Constraint.prototype._registerToPrimitives = function () {
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression._left === null) {
			expression._register(this);
		} else {
			stack.push(expression._left);
			stack.push(expression._right);
		}
	}
};

Constraint.prototype._unregisterFromPrimitives = function () {
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression._left === null) {
			expression._unregister(this);
		} else {
			stack.push(expression._left);
			stack.push(expression._right);
		}
	}
};

function LowerOrEqual(expression1, expression2, strength, weight) {
	Constraint.call(this, expression1, expression2, strength, weight);
}
LowerOrEqual.prototype = Object.create(Constraint.prototype);
LowerOrEqual.prototype.constructor = LowerOrEqual;
LowerOrEqual.prototype.construct = function () {
	this._constraint = new cassowary.Inequality(
		this._expression1.construct(),
		cassowary.LEQ,
		this._expression2.construct(),
		this._strength,
		this._weight
	);
	return this._constraint;
};

function GreaterOrEqual(expression1, expression2, strength, weight) {
	Constraint.call(this, expression1, expression2, strength, weight);
}
GreaterOrEqual.prototype = Object.create(Constraint.prototype);
GreaterOrEqual.prototype.constructor = GreaterOrEqual;
GreaterOrEqual.prototype.construct = function () {
	this._constraint = new cassowary.Inequality(
		this._expression1.construct(),
		cassowary.GEQ,
		this._expression2.construct(),
		this._strength,
		this._weight
	);
	return this._constraint;
};

function Equality(expression1, expression2, strength, weight) {
	Constraint.call(this, expression1, expression2, strength, weight);
}
Equality.prototype = Object.create(Constraint.prototype);
Equality.prototype.constructor = Equality;
Equality.prototype.construct = function () {
	this._constraint = new cassowary.Equation(
		this._expression1.construct(),
		this._expression2.construct(),
		this._strength,
		this._weight
	);
	return this._constraint;
};

module.exports = {
	Addition:       Addition,
	Subtraction:    Subtraction,
	Multiplication: Multiplication,
	Division:       Division,
	LowerOrEqual:   LowerOrEqual,
	GreaterOrEqual: GreaterOrEqual,
	Equality:       Equality
};