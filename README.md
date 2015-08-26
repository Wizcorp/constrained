# Constrained
**JavaScript Constraint solver** with automatic variable assignment and event emission on variable change.

[![Install with NPM](https://nodei.co/npm/constrained.png?downloads=true&stars=true)](https://nodei.co/npm/constrained/)

Finds a feasible solution to a system of constraints and assign it to linked **object properties**.
Based on **cassowary.js**, an implementation of the **simplex algorithm** (it can only handle linear continuous optimisation problems).

## How to use

### In a browser
Include Constrained's build in your html using either the [minified library](https://raw.githubusercontent.com/Wizcorp/constraint/master/build/constraint.min.js) or the [unminified version](https://raw.githubusercontent.com/Wizcorp/constraint/master/build/constraint.js).

```html
<script src="constraint.min.js"></script>
```

### In Node.js
Install Constrained using ```npm install constrained```, then require it:
```javascript
var Constrained = require('constrained');
```

##API

The following example shows **how to instantiate and solve** a **system** with two **variables**, one **constant** and one **constraint**:
``` javascript

var myObject1 = { a: 0, b: 0 };
var myObject2 = { c: 100 };

// Instantiation of the system
var mySystem = new Constrained.System();

// Instantiation of the variables and the constant
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

**To change a constant's value**:
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
var mySystem = new Constrained.System()
	.addConstraint('- x1 - x2 + 2 * x3 <= -3')
	.addConstraint('- 4 * x1 - 2 * x2 + x3 <= -4')
	.addConstraint('x1 + x2 - 4 * x3 <= 2')
	.addConstraint('x1 >= 0')
	.addConstraint('x2 >= 0')
	.addConstraint('x3 >= 0')
	.maximize('- 4 * x1 - 2 * x2 + x3')
	.resolve();

mySystem.log();

// Fetching variable values
var x1 = mySystem.getValue('x1');
var x2 = mySystem.getValue('x2');
var x3 = mySystem.getValue('x3');
var z  = mySystem.getObjectiveValue();

console.log('(x1, x2, x3, z) = (', x1, ',', x2, ',', x3, ',', z, ')');
```

**Possibility to define a system using the function API (for improved performance)**:
``` javascript
var Cst = Constrained;

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
	.addConstraint(myConstraint1)
	.addConstraint(myConstraint2)
	.addConstraint(myConstraint3)
	.addConstraint(myConstraint4)
	.addConstraint(myConstraint5)
	.addConstraint(myConstraint6)
	.maximize(objective)
	.resolve();

mySystem.log();
```

**To add callbacks on variable or solution changes**:
``` javascript
var mySquare = { width: 0, height: 0, area: 0 };
var myPerimeter = { length: 10 };

// Instantiation of the system
var mySystem = new Constrained.System()
	.addVariable('w', mySquare, 'width')
	.addVariable('h', mySquare, 'height')
	.addConstant('p', myPerimeter, 'length')
	.addConstraint('w = h')
	.addConstraint('w + h = p');

mySystem.getVariable('w').onChange(function(params, newValue, oldValue) {
	console.log('Width changed from', oldValue, 'to', newValue)	
});

mySystem.getVariable('h').onChange(function(params, newValue, oldValue) {
	console.log('Height changed from', oldValue, 'to', newValue)	
});

mySystem.onNewSolution(function(theSquare) {
	theSquare.area = theSquare.width * theSquare.height;
	console.log('New area is', theSquare.area);
}, mySquare);

// Solving the system to obtain a feasible solution
mySystem.resolve();

// Changing the value of the perimeter
myPerimeter.length = 20;

// Solving the system to obtain a new feasible solution
// that respect the new constant parameter
mySystem.resolve();
```

**Note:** Do not hesitate to post issues to suggest improvements