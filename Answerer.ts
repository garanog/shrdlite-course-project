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
      switch (question.questionWord) {
        case "where is":
          return answerWhereIsQuestion(question, state);
        case "how many":
          return answerHowManyQuestion(question, state);
      }
      return "";
    }

    function answerHowManyQuestion(question : Interpreter.QuestionInterpretationResult, state: WorldState) : string {
      return "There " + (question.interpretation == "is " ? "" : "are ")  + question.interpretation + " " + Parser.describeObject(question.parse.question.object)
          + (question.interpretation == "1" ? "" : "(s)");
    }

    function answerWhereIsQuestion(question : Interpreter.QuestionInterpretationResult, state: WorldState) : string {
      var result : string = "The ";

      //describe object
      var obj = Parser.getInnermostObject(question.parse.question.entity.object);
      result += Parser.describeObject(obj) + " is";

      if (state.holding === question.interpretation) return result + " held by the arm";

      var column : number = Interpreter.getColumn(state, question.interpretation);
      var yPos : number = Interpreter.getYPosition(state, question.interpretation);

      //what's underneath?
      var onTopOf : string = !yPos ? " on top of the floor" :
          ((state.objects[state.stacks[column][yPos - 1]].form.toLowerCase() === "box" ? 
          " in the " : " on top of the ") +
          Parser.describeObject(state.objects[state.stacks[column][yPos - 1]]));

      if (column == 0) return result + " furthest to the left " +  onTopOf;
      else if (column == state.stacks.length) return result + " furthest to the right" + onTopOf;

      result += onTopOf;

      var nextRightStackIndex : number = -1;
      var nextLeftStackIndex  : number = -1;
      for (let i : number = 0; i < state.stacks.length && nextRightStackIndex == -1; i++){
        if (state.stacks[i].length){
          if (i < column) nextLeftStackIndex = i;
          else if (i > column) nextRightStackIndex = i;
        }
      }

      if (nextRightStackIndex == -1 && nextLeftStackIndex == -1 ) return result;

      if (column - nextRightStackIndex > nextLeftStackIndex - column && nextRightStackIndex != -1)
        return result + " left of the "  + Parser.describeObject(state.objects[state.stacks[nextRightStackIndex][0]]);

      return result + " right of the " + Parser.describeObject(state.objects[state.stacks[nextLeftStackIndex][0]]);

    }

    export interface AnswererResult extends Interpreter.QuestionInterpretationResult {
	    answer: string;
    }
}
