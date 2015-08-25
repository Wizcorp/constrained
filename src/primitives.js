var cassowary  = require('cassowary');
var Expression = require('./Expression.js');

function Numeral(value) {
	this._value = value;
	Expression.call(this);
}
Numeral.prototype = Object.create(Expression.prototype);
Numeral.prototype.constructor = Numeral;

Numeral.prototype.construct = function () {
	return new cassowary.Expression(this._value);
};

Numeral.prototype._register   = function () {};
Numeral.prototype._unregister = function () {};


function ObjectBinder(name, object, property) {
	this._name     = name;
	this._object   = object;
	this._property = property;
	this._value    = object[property];

	this._constraints = [];
}

ObjectBinder.prototype._register = function (constraint) {
	this._constraints.push(constraint);
};

ObjectBinder.prototype._unregister = function (constraint) {
	var idx = this._constraints.indexOf(constraint);
	if (idx === -1) {
		this._constraints.splice(idx, 1);
	}
};


function Constant(name, object, property) {
	if ((this instanceof Constant) === false) {
		return new Constant(object, property);
	}

	ObjectBinder.call(this, name, object, property);
	Expression.call(this);
}
Constant.prototype = Object.create(Expression.prototype);
Constant.prototype.constructor = Constant;
Constant.prototype._register   = ObjectBinder.prototype._register;
Constant.prototype._unregister = ObjectBinder.prototype._unregister;

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


function Variable(name, object, property) {
	if ((this instanceof Variable) === false) {
		return new Variable(object, property);
	}

	// Callback and its parameters
	// Yes it is possible to pass the parameters of the callback
	// to allow the user to avoid keeping closures around (closures keep objects in memory!)
	this._onChange       = null;
	this._onChangeParams = null;

	ObjectBinder.call(this, name, object, property);
	Expression.call(this);

	this._variable = new cassowary.Variable({ name: this._name, value: this._value });
}
Variable.prototype = Object.create(cassowary.Variable.prototype);
Variable.prototype.constructor = Variable;
Variable.prototype._register = ObjectBinder.prototype._register;

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

Variable.prototype.onChange = function (onChange, onChangeParams) {
	this._onChange       = onChange;
	this._onChangeParams = onChangeParams;
	return this;
};

module.exports = {
	Numeral:  Numeral,
	Constant: Constant,
	Variable: Variable
};