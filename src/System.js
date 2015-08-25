var cassowary       = require('cassowary');
var primitives      = require('./primitives.js');
var operators       = require('./operators.js');
var parseExpression = require('./parser.js');

var Numeral  = primitives.Numeral;
var Constant = primitives.Constant;
var Variable = primitives.Variable;

var Equality       = operators.Equality;
var Multiplication = operators.Multiplication;

function System() {
	if ((this instanceof System) === false) {
		return new System();
	}

	this._solver = new cassowary.SimplexSolver();
	this._solver.autoSolve = false;

	this._variables   = [];
	this._constants   = [];
	this._constraints = {};
	this._parameters  = {};

	// Callback and its parameters
	// Yes it is possible to pass the parameters of the callback
	// to allow the user to avoid keeping closures around (closures keep objects in memory!)
	this._onNewSolution       = null;
	this._onNewSolutionParams = null;

	this._forceResolving = true;

	// Optimization parameters
	this.z = 0;
	this._objectiveVariable = null;
	this._optimization = false;
	this._minimization = true;

	// Callback function when a parameter is missing
	// when parsing an expression
	var self = this;
	this._onParameterMissing = function (name) {
		self.addVariable(name, { x: 0 }, 'x');
	};
}
module.exports = System;

System.prototype.onNewSolution = function (onNewSolution, onNewSolutionParams) {
	this._onNewSolution       = onNewSolution;
	this._onNewSolutionParams = onNewSolutionParams;
	return this;
};

System.prototype._optimize = function (expression) {
	if (expression instanceof Variable === true) {
		this._objectiveVariable = expression;
		this._solver.optimize(expression._variable);
	} else {
		this._objectiveVariable = new Variable('z', { z: 0 }, 'z');
		this.addConstraint(new Equality(this._objectiveVariable, expression));
		this._solver.optimize(this._objectiveVariable._variable);
	}

	this._forceResolving = true;
	this._optimization   = true;
};

System.prototype.minimize = function (expression) {
	if (typeof(expression) === 'string') {
		expression = parseExpression(expression, this._parameters, this._onParameterMissing);
	}

	this._optimize(expression);
	this._minimization = true;
	return this;
};

System.prototype.maximize = function (expression) {
	if (typeof(expression) === 'string') {
		expression = parseExpression(expression, this._parameters, this._onParameterMissing);
	}

	this._optimize(new Multiplication(expression, new Numeral(-1)));
	this._minimization = false;
	return this;
};

System.prototype.addVariable = function (name, object, property) {
	var variable = new Variable(name, object, property);
	this._variables.push(variable);
	this._parameters[name] = variable;
	return this;
};

System.prototype.addConstant = function (name, object, property) {
	var constant = new Constant(name, object, property);
	this._constants.push(constant);
	this._parameters[name] = constant;
	return this;
};

System.prototype.getVariable = function (name) {
	for (var v = 0; v < this._variables.length; v += 1) {
		if (this._variables[v]._name === name) {
			return this._variables[v];
		}
	}
};

System.prototype.addConstraint = function (constraint) {
	if (typeof(constraint) === 'string') {
		constraint = parseExpression(constraint, this._parameters, this._onParameterMissing);
	}

	if (this._constraints[constraint._id] !== undefined) {
		console.warn('[System.addConstraint] Constraint already present in the system:', constraint);
		return;
	}

	this._solver.addConstraint(constraint.construct());
	this._constraints[constraint._id] = constraint;

	this._forceResolving = true;
	return this;
};

System.prototype.removeConstraint = function (constraint) {
	if (this._constraints[constraint._id] === undefined) {
		console.warn('[System.removeConstraint] Constraint not present in the system:', constraint);
		return;
	}

	constraint._unregisterFromPrimitives();
	this._solver.removeConstraint(constraint._constraint);
	delete this._constraints[constraint._id];

	this._forceResolving = true;
	return this;
};

System.prototype.resolve = function (slacking) {
	var c0, c1, constraint;

	var systemIsSameSameButDifferent = this._forceResolving;
	this._forceResolving = false;

	// Checking whether a constant has changed
	var constraintsToUpdate = null;
	for (c0 = 0; c0 < this._constants.length; c0 += 1) {
		var constant = this._constants[c0];
		if (constant.refresh()) {
			// The value of the constant has changed

			// At least one constraint will be updated
			if (constraintsToUpdate === null) {
				constraintsToUpdate = {};
			}

			// Updating all the constraints containing the constant
			var constraints = constant._constraints;
			for (c1 = 0; c1 < constraints.length; c1 += 1) {
				constraint = constraints[c1];
				constraintsToUpdate[constraint.id] = constraint;
			}

			// Therefore it will need resolving
			systemIsSameSameButDifferent = true;
		}
	}

	if (constraintsToUpdate !== null) {
		var constraintIds = Object.keys(constraintsToUpdate);
		for (c1 = 0; c1 < constraintIds.length; c1 += 1) {
			constraint = constraintsToUpdate[constraintIds[c1]];
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
	}

	if (systemIsSameSameButDifferent === false && slacking === true) {
		return;
	}

	this._solver.resolve();

	// Refreshing variables so that their corresponding objects get updated
	// with the newly computed feasible solution
	var solutionIsSameSameButDifferent = false;
	for (var v = 0; v < this._variables.length; v += 1) {
		if (this._variables[v].refresh() === true) {
			solutionIsSameSameButDifferent = true;
		}
	}

	if (this._optimization === true) {
		this._objectiveVariable.refresh();
		this.z = (this._minimization === true) ? this._objectiveVariable._value : -this._objectiveVariable._value;
	}

	if (solutionIsSameSameButDifferent === true) {
		if (this._onNewSolution !== null) {
			this._onNewSolution(this._onNewSolutionParams);
		}
	}

	return this;
};

System.prototype.log = function () {
	for (var v = 0; v < this._variables.length; v += 1) {
		var variable = this._variables[v];
		console.log(variable._name, '=', variable._value);
	}

	console.log('objective value =', this.z);
};
