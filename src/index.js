var cassowary = require('cassowary');

/**
 * CONSTRAINED Module
 * Binds Cassowary variables to object properties so that changes in solution to a constraint problem
 * are easily assigned to those properties.
 *
 * @author Brice Chevalier
 *
 */

// *- TOGO WHEN SOLVER FIXED -*
function Expression() {
	this._left  = null;
	this._right = null;
}

Expression.prototype.addExpressions = function (left, right) {
	this._left  = left;
	this._right = right;
};

// Overridable method
Expression.prototype.construct = function () {};

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

	this._id = (constraintCount++).toString();

	this._constraint = null;
}

Constraint.prototype.getConstants = function () {
	var constants = [];

	// TODO: handle multiple appearance of a single constant
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression._left === null) {
			if (expression instanceof Constant) {
				constants.push(expression);
			}
		} else {
			stack.push(expression._left);
			stack.push(expression._right);
		}
	}

	return constants;
};

Constraint.prototype.getVariables = function () {
	var variables = [];

	// TODO: handle multiple appearance of a single variable
	var stack = [this._expression1, this._expression2];
	while (stack.length !== 0) {
		var expression = stack.pop();
		if (expression._left === null) {
			if (expression instanceof Variable) {
				variables.push(expression);
			}
		} else {
			stack.push(expression._left);
			stack.push(expression._right);
		}
	}

	return variables;
};

function Inequality(expression1, expression2, strength, weight, operator) {
	Constraint.call(this, expression1, expression2, strength, weight);
	this._operator = operator;
}
Inequality.prototype = Object.create(Constraint.prototype);
Inequality.prototype.constructor = Inequality;
Inequality.prototype.construct = function () {
	this._constraint = new cassowary.Inequality(
		this._expression1.construct(),
		this._operator,
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
// *--------------------------*

function NumericalValue(value) {
	this._value = value;
	Expression.call(this);
}
NumericalValue.prototype = Object.create(Expression.prototype);
NumericalValue.prototype.constructor = NumericalValue;

NumericalValue.prototype.construct = function () {
	return new cassowary.Expression(this._value);
};

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

	ObjectBinder.call(this, object, property, (constantCount++).toString());
	Expression.call(this);
}
Constant.prototype = Object.create(Expression.prototype);
Constant.prototype.constructor = Constant;

Constant.prototype.construct = function () {
	return new cassowary.Expression(this._object[this._property]);
};

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
	// to allow the user to avoid keeping closures around (closures keep objects in memory!)
	this._onChange       = null;
	this._onChangeParams = null;

	ObjectBinder.call(this, object, property, (variableCount++).toString());
	Expression.call(this);

	this._variable = new cassowary.Variable({ name: this._id, value: this._value });
}
Variable.prototype = Object.create(cassowary.Variable.prototype);
Variable.prototype.constructor = Variable;

Variable.prototype.construct = function () {
	return new cassowary.Expression(this._variable, 1);
};

Variable.prototype.refresh = function () {
	if (this._value !== this._variable.value) {
		this._object[this._property] = this._variable.value;
		if (this._onChange !== null) {
			this._onChange(this._onChangeParams, this._variable.value, this._value);
		}
		this._value = this._variable.value;
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
	// to allow the user to avoid keeping closures around (closures keep objects in memory!)
	this._onNewSolution       = null;
	this._onNewSolutionParams = null;

	this._forceResolving = true;

	this.optimalValue = 0;
}

System.prototype.onNewSolution = function (onNewSolution, onNewSolutionParams) {
	this._onNewSolution       = onNewSolution;
	this._onNewSolutionParams = onNewSolutionParams;
	return this;
};

System.prototype.minimize = function (expression) {
	if (expression instanceof Variable === true) {
		this._solver.optimize(expression._variable);
	} else {
		var objectiveVariable = new Variable(this, 'optimalValue');
		this.addConstraint(new Equality(objectiveVariable, expression));
		this._solver.optimize(objectiveVariable._variable);
	}

	this._forceResolving = true;
	return this;
};

System.prototype.maximize = function (expression) {
	return this.minimize(new Multiplication(expression, new NumericalValue(-1)));
};

System.prototype.addConstraint = function (constraint) {
	if (this._constraints[constraint._id] !== undefined) {
		console.warn('[System.addConstraint] Constraint already present in the system:', constraint);
		return;
	}

	// *- TOGO WHEN SOLVER FIXED -*
	var constants = constraint.getConstants();
	for (var c = 0; c < constants.length; c += 1) {
		var constant = constants[c];
		var constantId = constant._id;
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
		var variable = variables[v];
		var variableId = variable._id;
		if (this._variables[variableId] === undefined) {
			this._variables[variableId] = variable;
		}
	}
	this._variableIds = Object.keys(this._variables);


	var cassowaryConstraint = constraint.construct();
	this._solver.addConstraint(cassowaryConstraint);
	this._constraints[constraint._id] = constraint;

	this._forceResolving = true;
	return this;
};

System.prototype.resolve = function (slacking) {
	var systemIsSameSameButDifferent = this._forceResolving;
	this._forceResolving = false;

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
				this._solver.removeConstraint(constraint._constraint);
				// 2 - Reconstructing to consider the new constant value
				constraint.construct();
				// 3 - Add back the constraint
				this._solver.addConstraint(constraint._constraint);

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
	for (var v = 0; v < this._variableIds.length; v += 1) {
		var variableId = this._variableIds[v];
		if (this._variables[variableId].refresh() === true) {
			solutionIsSameSameButDifferent = true;
		}
	}

	if (solutionIsSameSameButDifferent === true) {
		if (this._onNewSolution !== null) {
			this._onNewSolution(this._onNewSolutionParams);
		}
	}

	return this;
};

var Constrained = {
	// System of constraints
	System: System,

	// Primitive types
	Variable: Variable,
	Constant: Constant,

	// Expression operators
	plus: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Addition(expression1, expression2);
	},

	minus: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Subtraction(expression1, expression2);
	},

	times: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Multiplication(expression1, expression2);
	},

	dividedBy: function (expression1, expression2) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Division(expression1, expression2);
	},

	// Constraint generators
	greaterThan: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Inequality(expression1, expression2, strength, weight, cassowary.GEQ);
	},

	smallerThan: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
		return new Inequality(expression1, expression2, strength, weight, cassowary.LEQ);
	},

	equals: function (expression1, expression2, strength, weight) {
		if (typeof(expression1) === 'number') { expression1 = new NumericalValue(expression1); }
		if (typeof(expression2) === 'number') { expression2 = new NumericalValue(expression2); }
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