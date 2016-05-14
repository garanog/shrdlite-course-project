The interpreter works by dividing the different parts of the 
interpretation to different functions.

Firstly the function interpretCommand looks what type the 
command is, and calls its corresponding interpreter-function,
such as interpretMoveCommand if the command is a move-command.

The case specific interpret command will then fetch the required
information to create the DNF, that is one or two sets of 
objects and the relation between them or to the world.

The set of objects are found using interpretEntity. interpret-
Entity is in the future supposed to interpret and handle the
quantifier. Since we do not care about the quantifier at this 
point it mainly calls the function interpretObject.

Candidates for matching objects are found by means of a complete
search over the list of objects in the world. Nested relations
are can be interpreted by making use of recursive calls of the
interpret...-commands.
