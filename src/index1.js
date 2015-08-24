var cassowary = require('cassowary');

/**
 * CONSTRAINED Module
 * Binds Cassowary variables to object properties so that changes in solution to a constraint problem
 * are easily assigned to those properties.
 *
 * @author Brice Chevalier
 *
 */

// var GEQ = cassowary.GEQ;
// var LEQ = cassowary.LEQ;

// var AbstractVariable   = cassowary.AbstractVariable;
// var Variable           = cassowary.Variable;
// var DummyVariable      = cassowary.DummyVariable;
// var ObjectiveVariable  = cassowary.ObjectiveVariable;
// var SlackVariable      = cassowary.SlackVariable;
// var Point              = cassowary.Point;
// var Expression         = cassowary.Expression;
// var AbstractConstraint = cassowary.AbstractConstraint;
// var StayConstraint     = cassowary.StayConstraint;
// var Constraint         = cassowary.Constraint;
// var Inequality         = cassowary.Inequality;
// var Equation           = cassowary.Equation;

// *- TOGO WHEN SOLVER FIXED -*
function Expression() {
	this.left  = null;
	this.right = null;

	this.addExpressions = function (left, right) {
		this.left  = left;
		this.right = right;
	};

	this.construct = function () {
		return this;
	};
}

function Plus(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Plus.prototype = Object.create(cassowary.Expression.prototype);
Plus.prototype.constructor = Plus;
Plus.prototype.construct = function () {
	return this.left.construct().plus(this.right.construct());
};

function Minus(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Minus.prototype = Object.create(cassowary.Expression.prototype);
Minus.prototype.constructor = Minus;
Minus.prototype.construct = function () {
	return this.left.construct().minus(this.right.construct());
};

function Times(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Times.prototype = Object.create(cassowary.Expression.prototype);
Times.prototype.constructor = Times;
Times.prototype.construct = function () {
	return this.left.construct().times(this.right.construct());
};

function Divide(expression1, expression2) {
	Expression.call(this);
	this.addExpressions(expression1, expression2);
}
Divide.prototype = Object.create(cassowary.Expression.prototype);
Divide.prototype.constructor = Divide;
Divide.prototype.construct = function () {
	return this.left.construct().divide(this.right.construct());
};

cassowary.Inequality.prototype.initializeMore = cassowary.Inequality.prototype.initialize;
cassowary.Inequality.prototype.initialize = function (expression1, expression2, strength, weight, operator) {
	this._expression1 = expression1;
	this._expression2 = expression2;
	this._strength    = strength;
	this._weight      = weight;
	this._operator    = operator;

	this.initializeMore();
};

cassowary.Inequality.prototype.construct = function () {
	return cassowary.Equation.call(this,
		this._expression1.construct(),
		this._expression2.construct(),
		this._strength,
		this._weight
	);
};

cassowary.Equation.prototype.initializeMore = cassowary.Equation.prototype.initialize;
cassowary.Equation.prototype.initialize = function (expression1, expression2, strength, weight) {
	this._expression1 = expression1;
	this._expression2 = expression2;
	this._strength    = strength;
	this._weight      = weight;

	this.initializeMore();
};

cassowary.Equation.prototype.construct = function () {
	return cassowary.Equation.call(this,
		this._expression1.construct(),
		this._expression2.construct(),
		this._strength,
		this._weight
	);
};

cassowary.Constraint.prototype.getConstants = function () {
	var constants = [];

	// TODO: handle multiple appearance of a single constant
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression.left === null) {
			if (expression instanceof Constant) {
				constants.push(expression);
			}
		} else {
			stack.push(expression.left);
			stack.push(expression.right);
		}
	}

	return constants;
};

cassowary.Constraint.prototype.getVariables = function () {
	var variables = [];

	// TODO: handle multiple appearance of a single variable
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression.left === null) {
			if (expression instanceof Variable) {
				variables.push(expression);
			}
		} else {
			stack.push(expression.left);
			stack.push(expression.right);
		}
	}

	return variables;
};
// *--------------------------*

function ObjectBinder(object, property, id) {
	this._object   = object;
	this._property = property;
	this._id       = id;
	this._value    = object[property];
}

var constantCount = 0;
function Constant(object, property) {
	if ((this instanceof Constant) === false) {
		return new Constant(object, property);
	}

	Expression.call(this);
	ObjectBinder.call(this, object, property, (constantCount++).toString());
	cassowary.Expression.call(this, this._value);
}
Constant.prototype = Object.create(cassowary.Expression.prototype);
Constant.prototype.constructor = Constant;

Constant.prototype.refresh = function () {
	if (this._value !== this._object[this._property]) {
		this._value = this._object[this._property];
		return true;
	}

	return false;
};

var variableCount = 0;
function Variable(object, property) {
	if ((this instanceof Variable) === false) {
		return new Variable(object, property);
	}

	// Callback and its parameters
	// Yes it is possible to pass the parameters of the callback
	// to allow the user to avoid keeping closures around (closures are not memory free!)
	this.onChange       = null;
	this.onChangeParams = null;

	Expression.call(this);
	ObjectBinder.call(this, object, property, (variableCount++).toString());
	cassowary.Variable.call(this, { name: this._id, value: this._value });
}
Variable.prototype = Object.create(cassowary.Variable.prototype);
Variable.prototype.constructor = Variable;

Variable.prototype.refresh = function () {
	if (this._value !== this.value) {
		this._object[this._property] = this.value;
		if (this.onChange !== null) {
			this.onChange(this.onChangeParams, this._value);
		}
		this._value = this.value;
		return true;
	}

	return false;
};

function ConstantHandle(constant, constraint) {
	this.constant = constant;
	this.constraints = [constraint];
}

function System() {
	if ((this instanceof System) === false) {
		return new System();
	}

	this._solver = new cassowary.SimplexSolver();
	this._solver.autoSolve = false;

	this._variables   = {};
	this._constraints = {};
	this._variableIds = null;

	// *- TOGO WHEN SOLVER FIXED -*
	this._constants   = {};
	this._constantIds = null;
	// *--------------------------*

	// Callback and its parameters
	// Yes it is possible to pass the parameters of the callback
	// to allow the user to avoid keeping closures around (closures are not memory free!)
	this.onNewSolution       = null;
	this.onNewSolutionParams = null;
}

System.prototype.onNewSolution = function (onNewSolution, onNewSolutionParams) {
	this.onNewSolution       = onNewSolution;
	this.onNewSolutionParams = onNewSolutionParams;
	return this;
};

System.prototype.addConstraint = function (constraint) {
	if (this._constraints[constraint.id] !== undefined) {
		console.warn('[System.addConstraint] Constraint already present in the system:', constraint);
		return;
	}

	// *- TOGO WHEN SOLVER FIXED -*
	var constants = constraint.getConstants();
	for (var c = 0; c < constants.length; c += 1) {
		var constant = constants[c];
		var constantId = constant.id;
		if (this._constants[constantId] === undefined) {
			this._constants[constantId] = new ConstantHandle(constant, constraint);
		} else {
			this._constants[constantId].constraints.push(constraint);
		}
	}
	this._constantIds = Object.keys(this._constants);
	// *--------------------------*

	var variables = constraint.getVariables();
	for (var v = 0; v < variables.length; v += 1) {
		var variable = variables[c];
		var variableId = variable.id;
		if (this._variables[variableId] === undefined) {
			this._variables[variableId] = variable;
		}
	}
	this._variableIds = Object.keys(this._variables);

	this._constraints[constraint.id] = constraint;
	this._solver.addConstraint(constraint.construct());
	return this;
};

System.prototype.resolve = function (slacking) {
	var systemIsSameSameButDifferent = false;

	// Checking whether a constant has changed
	for (var c0 = 0; c0 < this._constantIds.length; c0 += 1) {
		var constantId = this._constantIds[c0];
		var constantHandle = this._constants[constantId];
		var constant = constantHandle.constant;
		if (constant.refresh()) {
			// The value of the constant has changed

			// *- TOGO WHEN SOLVER FIXED -*
			// Updating all the constraints containing the constant
			var constraints = constantHandle.constraints;
			for (var c1 = 0; c1 < constraints.length; c1 += 1) {
				var constraint = constraints[c1];

				// (Inefficient) Process to update a constraint:
				// 1 - Remove the constraint
				this._solver.removeConstraint(constraint);
				// 2 - Reconstructing to consider the new constant value
				constraint.construct();
				// 3 - Add back the constraint
				this._solver.addConstraint(constraint);

				// Should be:
				// constraint.updateConstant(constant);
			}
			// *--------------------------*

			// Therefore it will need resolving
			systemIsSameSameButDifferent = true;
		}
	}

	if (systemIsSameSameButDifferent === false && slacking === true) {
		return;
	}

	this._solver.resolve();

	// Refreshing variables so that their corresponding objects get updated
	// with the newly computed feasible solution
	var solutionIsSameSameButDifferent = false;
	for (var v = 0; v < this._variablesIds.length; v += 1) {
		var variableId = this._variableIds[v];
		if (this._variables[variableId].refresh() === true) {
			solutionIsSameSameButDifferent = true;
		}
	}

	if (solutionIsSameSameButDifferent === true) {
		if (this.onNewSolution !== null) {
			this.onNewSolution(this.onNewSolutionParams);
		}
	}

	return this;
};

var Constrained = {
	// System of constraints
	System: System,

	// Primitive types
	Variable:   Variable,
	Constant:   Constant,

	// Expression operators
	plus: function (expression1, expression2) {
		return new Plus(expression1, expression2);
	},

	minus: function (expression1, expression2) {
		return new Minus(expression1, expression2);
	},

	times: function (expression1, expression2) {
		return new Times(expression1, expression2);
	},

	divide: function (expression1, expression2) {
		return new Divide(expression1, expression2);
	},

	// Constraint generators
	greaterThan: function (expression1, expression2, strength, weight) {
		return new Inequality(expression1, expression2, strength, weight, cassowary.GE);
	},

	smallerThan: function (expression1, expression2, strength, weight) {
		return new Inequality(expression1, expression2, strength, weight, cassowary.LE);
	},

	equals: function (expression1, expression2, strength, weight) {
		return new Equation(expression1, expression2, strength, weight);
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