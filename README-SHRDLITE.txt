User question, "Where is"
    The user is able to ask where an object is.
    Ex. "Where is the white ball"

    grammar:
        new main,
        added type question, questionWord

    parser:
        new interface Question
        new interface Utterance, which contains either a Command or a Question
        ParseResult now contains a utterance, meaning that the parse can return either questions or commands
        utility functions to help describing objects.

    shrdlite:
        handle new paths for questions (parser->interpreter->answerer)

    interpreter:
        new interface QuestionInterpretationResult
        new functions for handling the interpretation of questions
        now returns one object holding the lists of all results, as well as identifier of which list is important

    Answerer:
        new class made for constructing answers
        If inerpretation contains answers, they will be sent to the Answerer instead of the planner
        the answerer will construct a correct answer from the interpretation.

    SVGWorld:
        new function for printing the result of the question
        will be called by the shrdlite once answers have been constructed


User question, "How many"
    Ex. “how many balls are there” or “how many blue objects are there”

    grammar:
        new questions, as well as relevant keywords and additions to the lexicon
    
    Interpreter:
        Interprets the question and finds out the relevant numbers

    Answerer:
        New function to construct the answer for the question.


Planner describing its actions:
    Ex. Any movement

    SVGWorld:
        Functions added to describe an action as well as describing objects.
        Called at the start of a new action 


Anaphoric references
    See interpretDesiredForm(...) in the interpreter. A list of previously seen
    objects was added to the interpretObject(...) functions for this purpose.

    So far, anaphoric references that reference objects within the same nested objects
    do not work. Anaphoric references can be used in commands of the form
    "move [A] [relation] [B]", where references within [B] to objects mentioned in [A] work.

    * Example 1: In the small world: “put the blue box in the red one”

    * Example 2: In the small world: “put the black ball that is in
        the blue box in the red one”


Test cases
    Some simple smoke tests to see whether the pipeline works in general, see TestCustom.ts.

    * questions: a smoke test for the question asking pipeline.
        A question about the small world is parsed,
        interpreted and the resulting answer is verified.

    * planner: a smoke test for the planner, which parses, interprets and plans a
         command in the small world, and compares the resulting list
        of actions to the expected list of actions.


Error Handling
     Error messages are implemented using exceptions, which are thrown including
    an appropriate error message. Among others, we distinguish the following cases
    in the interpreter:

    * No simple object with the desired color, form and size exists (“Could not find the...”)

    * Anaphoric reference without previously mentioned object (“You didn't mention
        anything before, I don't understand which object you mean by that anaphoric reference.”)

    * Complex object cannot be found (“Could not find a ... that is ...”)

    * Physical laws (with detailed message describing which law would be broken,
        e.g. “a ball cannot be placed on top of a ball”)


Counting:
    You now can ask it to interpret numbers as quantifiers. So for example you can asl, “Put two balls on the floor”. The main changes were in:
	The grammar - had to allow the quantifiers 
	The interpreter - had to add the correct number of interpretations. 


Distinguishing between “All”, “Any” and “The” quantifiers:
    Shrdlite now acts differently depending on the quantifier used.
    It also checks if there are more objects than locations for the “All” quantifier.
    You can ask utterances like:
	- take the blue object
	- put the white ball on the box
	- put all boxes on a table
	- put all boxes on the floor
	- move all balls inside a large box
    The system will interpret them correctly and do what it is asked for or issue a specific error on what went wrong

    In order to make this extension, the code in the file “Interpreter.ts” was modified. The
    Function interpretMoveCommand was extended with several checks depending on the quantifier.
    Also, the combineSetsToDNF function (which handles the creation of the DNFFormula result) was extended to handle the combination of the objects and locations in different ways depending on the quantifier. The most interesting part was generating the combination of objects for the “All” quantifier. Which required to generate lists with all the possible combinations of objects within two sets without having repeated objects within each list.
