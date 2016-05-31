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
        result += Parser.describeObject(state.objects[state.stacks[column][yPos - 1]]);

      if (state.stacks[column].length != yPos + 1)
          result += " under the " + Parser.describeObject(state.objects[state.stacks[column][yPos + 1]]);

      var nextRightStackIndex : number = -1;
      var nextLeftStackIndex  : number = -1;
      for (let i : number = 0; i > state.stacks.length, nextRightStackIndex == -1; i++){
        if (state.stacks[i].length){
          if (i < column) nextLeftStackIndex = i;
          else if (i > column) nextRightStackIndex = i;
        }
      }

      if (nextRightStackIndex != -1)
          result += " left of the " + Parser.describeObject(state.objects[state.stacks[nextRightStackIndex][0]]);

      if (nextLeftStackIndex != -1)
          result += " right of the " + Parser.describeObject(state.objects[state.stacks[nextLeftStackIndex][0]]);

      var onTopOf = !yPos ? "floor" :
          Parser.describeObject(state.objects[state.stacks[column][yPos - 1]]);

      var under : string = state.stacks[column].length == yPos + 1 ? null : 
          Parser.describeObject(state.objects[state.stacks[column][yPos + 1]]);

      var leftOf  : string = nextRightStackIndex == -1 ? null :
          Parser.describeObject(state.objects[state.stacks[nextRightStackIndex][0]]);

      var rightOf : string = nextLeftStackIndex  == -1 ? null :
          Parser.describeObject(state.objects[state.stacks[nextLeftStackIndex][0]]);

      return result;
    }

    export interface AnswererResult extends Interpreter.QuestionInterpretationResult {
	    answer: string;
    }
}
