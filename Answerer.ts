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

    export function answerQuestion(question : Interpreter.QuestionInterpretationResult, state: WorldState) : string {
      var result : string = "The ";

      //describe object
      var obj : Parser.Object;
      for (obj = question.parse.question.entity.object; obj.object != null; obj = obj.object) {
      }
      result += describeObject(obj);

      //what's underneath?
      result += " is on top of the "
      var column : number = Interpreter.getColumn(state, question.object);
      var yPos : number = Interpreter.getYPosition(state, question.object);

      if (!yPos)
        result += "floor";
      else
        result += describeObject(state.stacks[column][yPos - 1]);

      return result;
    }

    export function describeObject(obj: Parser.Object) : string {
      return (obj.size != null ? (obj.size + " ") : "")
        + (obj.color != null ? (obj.color + " ") : "")
        + (obj.form != null ? (obj.form) : "object");
    }

    export interface AnswererResult extends Interpreter.QuestionInterpretationResult {
	    answer: string;
    }
}
