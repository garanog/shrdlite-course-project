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

User question, "How many"

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
