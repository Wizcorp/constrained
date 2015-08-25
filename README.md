# Constrained
**JavaScript Constraint solver** with automatic variable assignment and event emission on variable change.

[![Install with NPM](https://nodei.co/npm/constrained.png?downloads=true&stars=true)](https://nodei.co/npm/constrained/)

Finds a feasible solution to a system of constraints and assign it to linked **object properties**.
Based on **cassowary.js**, an implementation of the **simplex algorithm** (it can only handle linear continuous optimisation problems).

The following example shows **how to instantiate and solve** a **system** with two **variables**, one **constant** and one **constraint**:
``` javascript

var myObject1 = { a: 0, b: 0 };
var myObject2 = { c: 100 };

// Instanciation of the system
var mySystem = new Cst.System();

// Instanciation of the variables and the constant
mySystem.addVariable('x', myObject1, 'a'); // variable named x
mySystem.addVariable('y', myObject1, 'b'); // variable named y
mySystem.addConstant('c', myObject2, 'c'); // constant named c

// Definition of the system
mySystem.addConstraint('x + y = c');

// Solving the system to obtain a feasible solution
mySystem.resolve();

// Displaying the result
mySystem.log(); // x + y = 100

// Making sure that objects have been updated
console.log('(x, y) = (', myObject1.a, ',', myObject1.b, ')');
```

**To change a constant value**
``` javascript
// Changing the value of the property associated with c
myObject2.c = 25;

// Solving the system to obtain a new feasible solution
// that respect the new constant parameter
mySystem.resolve();

// Displaying the solution
mySystem.log(); // x + y = 25

// Making sure that objects have been updated
console.log('(x, y) = (', myObject1.a, ',', myObject1.b, ')'); 
```

**To specify an objective to optimize**:
``` javascript
// Bounding x
mySystem.addConstraint('x >= 0')
mySystem.minimize('x');

// Solving the system will now give an optimal
// solution to the optimization problem
mySystem.resolve();

// Displaying the solution
mySystem.log(); // x + y = 25, x minimized and >= 0

// Making sure that objects have been updated
console.log('(x, y) = (', myObject1.a, ',', myObject1.b, ')');
```

**Possibility to chain function calls**:
``` javascript
var myObject1 = { x: 0 };
var myObject2 = { x: 0 };
var myObject3 = { x: 0 };

var mySystem = new Cst.System()
	.addVariable('x1', myObject1, 'x')
	.addVariable('x2', myObject2, 'x')
	.addVariable('x3', myObject3, 'x')
	.addConstraint('- x1 - x2 + 2 * x3 <= -3')
	.addConstraint('- 4 * x1 - 2 * x2 + x3 <= -4')
	.addConstraint('x1 + x2 - 4 * x3 <= 2')
	.addConstraint('x1 >= 0')
	.addConstraint('x2 >= 0')
	.addConstraint('x3 >= 0')
	.maximize('- 4 * x1 - 2 * x2 + x3')
	.resolve();

mySystem.log();
```

**Possibility to use the function API for defining systems (for improved performance)**:
``` javascript
var myObject1 = { x: 0 };
var myObject2 = { x: 0 };
var myObject3 = { x: 0 };

var mySystem = new Cst.System();

var myVariable1 = mySystem.addVariable('x1', myObject1, 'x').getVariable('x1');
var myVariable2 = mySystem.addVariable('x2', myObject2, 'x').getVariable('x2');
var myVariable3 = mySystem.addVariable('x3', myObject3, 'x').getVariable('x3');

var objective = Cst.plus(Cst.plus(Cst.times(-4, myVariable1), Cst.times(-2, myVariable2)), Cst.times(1, myVariable3));

var myConstraint1 = Cst.lowerThan(Cst.plus(Cst.plus(Cst.times(-1, myVariable1), Cst.times(-1, myVariable2)), Cst.times( 2, myVariable3)), -3);
var myConstraint2 = Cst.lowerThan(Cst.plus(Cst.plus(Cst.times(-4, myVariable1), Cst.times(-2, myVariable2)), Cst.times( 1, myVariable3)), -4);
var myConstraint3 = Cst.lowerThan(Cst.plus(Cst.plus(Cst.times( 1, myVariable1), Cst.times( 1, myVariable2)), Cst.times(-4, myVariable3)),  2);

var myConstraint4 = Cst.greaterThan(myVariable1, 0);
var myConstraint5 = Cst.greaterThan(myVariable2, 0);
var myConstraint6 = Cst.greaterThan(myVariable3, 0);

mySystem
	.addConstraint(myConstraint1);
	.addConstraint(myConstraint2);
	.addConstraint(myConstraint3);
	.addConstraint(myConstraint4);
	.addConstraint(myConstraint5);
	.addConstraint(myConstraint6);
	.maximize(objective);
	.resolve();
	.log();
```
