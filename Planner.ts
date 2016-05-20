///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="ShrdliteGraph.ts"/>

/**
* Planner module
*
* The goal of the Planner module is to take the interpetation(s)
* produced by the Interpreter module and to plan a sequence of actions
* for the robot to put the world into a state compatible with the
* user's command, i.e. to achieve what the user wanted.
*
* The planner should use your A* search implementation to find a plan.
*/
module Planner {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
     * Top-level driver for the Planner. Calls `planInterpretation` for each given interpretation generated by the Interpreter.
     * @param interpretations List of possible interpretations.
     * @param currentState The current state of the world.
     * @returns Augments Interpreter.InterpretationResult with a plan represented by a list of strings.
     */
    export function plan(interpretations : Interpreter.InterpretationResult[], currentState : WorldState) : PlannerResult[] {
        var errors : Error[] = [];
        var plans : PlannerResult[] = [];
        interpretations.forEach((interpretation) => {
            try {
                var result : PlannerResult = <PlannerResult>interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface PlannerResult extends Interpreter.InterpretationResult {
        plan : string[];
    }

    export function stringify(result : PlannerResult) : string {
        return result.plan.join(", ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions

    /**
     * The core planner function. The code here is just a template;
     * you should rewrite this function entirely. In this template,
     * the code produces a dummy plan which is not connected to the
     * argument `interpretation`, but your version of the function
     * should be such that the resulting plan depends on
     * `interpretation`.
     *
     *
     * @param interpretation The logical interpretation of the user's desired goal. The plan needs to be such that by executing it, the world is put into a state that satisfies this goal.
     * @param state The current world state.
     * @returns Basically, a plan is a
     * stack of strings, which are either system utterances that
     * explain what the robot is doing (e.g. "Moving left") or actual
     * actions for the robot to perform, encoded as "l", "r", "p", or
     * "d". The code shows how to build a plan. Each step of the plan can
     * be added using the `push` method.
     */
    function planInterpretation(interpretation : Interpreter.DNFFormula, state : WorldState) : string[] {
      console.log("Plan interpretation.");

      var goal = ((node : StateNode) => {
        for (var conjunction of interpretation) { // conjunctions connected by ORs
          var conjunctionTrue = true;
          for (var literal of conjunction) { // literals connected by ANDs
            conjunctionTrue = conjunctionTrue && literalHolds(literal, node.state);
          }

          if (conjunctionTrue) {
            console.log("-----------------")
            console.log("goal found: ");
            console.log(conjunction);
            console.log("-----------------")
            return true;
          }
        }

        return false;
      });

      var heuristics = ((node : StateNode) => {
        var minDistance = 0;
        for (var conjunction of interpretation) { // conjunctions connected by ORs

          var distance : number = 0;
          for (var literal of conjunction) { // literals connected by ANDs
            distance = distance +
                (literalHolds(literal, node.state) ? 0 : calculateDistance(literal, state));
          }

          minDistance = distance < minDistance ? distance : minDistance;
        }
        return minDistance;
      });

      console.log("------------------")
      console.log("Running astar search.");
      console.log(state);
      console.log("------------------")
      var result : SearchResult<StateNode> = aStarSearch(
          new ShrdliteGraph(),
          new StateNode(state),
          goal,
          heuristics,
          10);

      console.log("------------------")
      console.log("astar search result.");
      console.log(result);
      console.log("------------------")


      return searchResultToActions(result);
    }

    function searchResultToActions(result : SearchResult<StateNode>) {
      var actions: Array<string> = new Array<string>();
      for (var pathElement of result.path)
        actions.push(pathElement.action);
      return actions;
    }

    export function literalHolds(literal : Interpreter.Literal, state : WorldState) : boolean {
      var relationHolds : boolean = false;

      //TODO we might want to extract this and some other things
      //into a "relation" class
      switch (literal.relation) {
        case "ontop":
          console.log("ontopof");
          console.log(literal);
          console.log(state);
          relationHolds = Interpreter.onTopOf(state, literal.args[0], literal.args[1]);
          console.log(relationHolds);
          break;
        case "inside":
          relationHolds = Interpreter.inside(state, literal.args[0], literal.args[1]);
          break;
        case "above":
          relationHolds = Interpreter.above(state, literal.args[0], literal.args[1]);
          break;
        case "under":
          relationHolds = Interpreter.under(state, literal.args[0], literal.args[1]);
          break;
        case "beside":
          relationHolds = Interpreter.beside(state, literal.args[0], literal.args[1]);
          break;
        case "leftof":
          relationHolds = Interpreter.leftOf(state, literal.args[0], literal.args[1]);
          break;
        case "rightof":
          relationHolds = Interpreter.rightOf(state, literal.args[0], literal.args[1]);
          break;
        default:
          throw new Error("Unknown relation: " + literal.relation);
      }

      return literal.polarity ? relationHolds : !relationHolds;
    }

    function calculateDistance(literal : Interpreter.Literal, state : WorldState) : number{

      // Version 0
      var lowestDistance : number = 1;

      /*
      // Version 1
      var lowestDistance : number = 1;
      var distanceInStack : number;
      for (var stack of state.stacks) {
        distanceInStack = -1;
        for (var objectName of stack) {
          if (collections.arrays.contains(literal.args, objectName)){
              distanceInStack = 1;
          } else if (distanceInStack != -1){
              distanceInStack = distanceInStack + 3;
          }
        }
        if (distanceInStack != -1){
          lowestDistance = lowestDistance < (distanceInStack) ? lowestDistance : (distanceInStack);
        }
      }
      */
      /*
      // Version 3
      var totalDistance : number = 0;
      for (var argument of literal.args){
        var lowestDistance : number = 1;
        var distanceInStack : number;
        for (var stack of state.stacks){
          distanceInStack = -1;
          for (var objectName of stack){
            if (argument == objectName){
              distanceInStack = 1;
            } else if (distanceInStack != -1){
              distanceInStack = distanceInStack + 3;
            }
          }
          if (distanceInStack != -1){
            lowestDistance = lowestDistance < (distanceInStack) ? lowestDistance : (distanceInStack);
          }
        }
        totalDistance = totalDistance + lowestDistance;
      }
      return totalDistance;
      */
      return lowestDistance;
    }
}
