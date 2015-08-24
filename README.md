# Constrained
**Constraint solver** with automatic variable assignment.
Finds and assign a feasible solution to a system of constraints linking **avascript object properties**.
Based on **cassowary.js**, an implementation of the **simplex algorithm**, it can only handle linear continuous optimisation problems.

The following example shows **how to instanciate and solve** a **system** with two **variables**, one **constant** and one **constraint**:
``` javascript

var myObjectA = { a: 0 };
var myObjectB = { b: 0 };
var myObjectC = { c: 100 };

// Instanciation of the variables and the constant
var myVariableA = new Constrained.Variable(myObjectA, 'a');
var myVariableB = new Constrained.Variable(myObjectB, 'b');
var myConstantC = new Constrained.Constant(myObjectC, 'c');

// Instanciation of the system
var mySystem = new Constrained.System();

// Defining the system
var AplusB = Constrained.plus(myVariableA, myVariableB);
var AplusBequalsC = Constrained.equals(AplusB, myConstantC);
mySystem.addConstraint(AplusBequalsC);

// Solving the system to obtain a feasible solution
mySystem.resolve();

console.log(myObjectA.a + myObjectB.b); // 100
```

**To change a constant value**:
``` javascript
// Changing the value of the property associated with myConstantC
myObjectC.c = 25;

// Solving the system to obtain a new feasible solution
// that respect the new constant parameter
mySystem.resolve();

console.log(myObjectA.a + myObjectB.b); // 25
```

**To specify an objective to optimize**:
``` javascript
mySystem.minimize(myVariableA); // or mySystem.maximize(myVariableA)

// Bounding A
var AgreaterThan0 = Constrained.greaterThan(myVariableA, 0);
mySystem.addConstraint(AgreaterThan0);

// Solving the system will now give an optimal
// solution to the optimization problem
mySystem.resolve();

console.log(myObjectA.a + myObjectB.b); // 25, constraint still satisfied
console.log(myObjectA.a); // 0, myObjectA.a has been minimized
```