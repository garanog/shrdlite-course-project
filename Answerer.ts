///<reference path="World.ts"/>
///<reference path="lib/node.d.ts"/>

/**
* Answerer answers questions.
* TODO
*/
module Answerer {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    export function answer(questions : Interpreter.QuestionInterpretationResult[], state: WorldState) : AnswererResult[] {
      var answererResults : AnswererResult[] = [];

      for (var question of questions) {
        var answererResult : AnswererResult = <AnswererResult> question;
        answererResult.answer = answerQuestion(question, state); //TODO switch case somewhere here (question type)
        answererResults.push(answererResult);
      }

      return null;
    }

    function answerQuestion(question : Interpreter.QuestionInterpretationResult, state: WorldState) : string {
      var result : string = "The ";

      //describe object
      var obj = Parser.getInnermostObject(question.parse.question.entity.object);
      result += Parser.describeObject(obj);

      //what's underneath?
      result += " is on top of the "
      var column : number = Interpreter.getColumn(state, question.object);
      var yPos : number = Interpreter.getYPosition(state, question.object);

      if (!yPos)
        result += "floor";
      else
        result += Parser.describeObject(state.stacks[column][yPos - 1]);

      return result;
    }

    export interface AnswererResult extends Interpreter.QuestionInterpretationResult {
	    answer: string;
    }
}
