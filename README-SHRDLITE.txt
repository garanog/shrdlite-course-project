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
