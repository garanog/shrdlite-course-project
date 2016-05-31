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

      return answererResults;
    }

    function answerQuestion(question : Interpreter.QuestionInterpretationResult, state: WorldState) : string {
      var result : string = "The ";

      //describe object
      var obj = Parser.getInnermostObject(question.parse.question.entity.object);
      result += Parser.describeObject(obj) + " is";

      if (state.holding === question.object) return result + " held by the arm";

      var column : number = Interpreter.getColumn(state, question.object);
      var yPos : number = Interpreter.getYPosition(state, question.object);
      if (column == 0) result += " furthest to the left";
      else if (column == state.stacks.length) result += " furthest to the right";

      //what's underneath?
      result += " on top of the "

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
