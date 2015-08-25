function Expression() {
	this._left  = null;
	this._right = null;
}
module.exports = Expression;

Expression.prototype.addExpressions = function (left, right) {
	this._left  = left;
	this._right = right;
};

// Overridable method
Expression.prototype.construct = function () {};