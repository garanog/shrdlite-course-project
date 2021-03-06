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
    export function plan(interpretations : Interpreter.CommandInterpretationResult[], currentState : WorldState) : PlannerResult[] {
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

    export interface PlannerResult extends Interpreter.CommandInterpretationResult {
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
        var minDistance = -1;
        for (var conjunction of interpretation) { // conjunctions connected by ORs

          var distance : number = 0;
          for (var literal of conjunction) { // literals connected by ANDs
            distance = Math.max(distance,
                (literalHolds(literal, node.state) ? 0 : calculateDistance(literal, state)));
          }

          minDistance = minDistance != -1? Math.min(distance, minDistance) : distance;
        }
        return minDistance == -1 ? 0 : minDistance;
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
        if (pathElement.action != undefined)
          actions.push(pathElement.action);
      return actions;
    }

    export function literalHolds(literal : Interpreter.Literal, state : WorldState) : boolean {
      var relationHolds : boolean = false;

      //TODO we might want to extract this and some other things
      //into a "relation" class
      switch (literal.relation) {
        case "ontop":
          relationHolds = Interpreter.onTopOf(state, literal.args[0], literal.args[1]);
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
        case "holding":
          relationHolds = state.holding === literal.args[0];
          break;
        default:
          throw new Error("Unknown relation: " + literal.relation);
      }

      return literal.polarity ? relationHolds : !relationHolds;
    }

    function calculateDistance(literal : Interpreter.Literal, state : WorldState) : number{
      

      switch (literal.relation) {
          case "ontop":
          case "inside":
            return calculateDistanceOntop(literal.args[0], literal.args[1], state);
          case "above":
            return calculateDistanceOntop(literal.args[0], literal.args[1], state);
          case "under":
            return calculateDistanceOntop(literal.args[1], literal.args[0], state);
          case "beside":
            return calculateDistanceBeside(literal.args[0], literal.args[1], state);
          case "leftof":
            return calculateDistanceLeftOf(literal.args[0], literal.args[1], state);
          case "rightof":
            return calculateDistanceLeftOf(literal.args[1], literal.args[0], state);
          case "holding":
            return calculateDistanceHolding(literal.args[0], state);
          default:
              // code...
              break;
      }

      return 1;
    }

    function calculateDistanceOntop(objA : string, objB : string, state : WorldState) : number{
      let drop = state.holding == null ? 0 : 1;

      /*
      * If we want to put an object on the floor:
      * If we hold the object, best case (bc) is that we only have to put it down
      * Otherwise:
      * empty arm (0 or 1)
      * get to stack where object is (1 move per distance)
      * remove all items above what we're looking for (bc: pick up, move, drop move back, total 4 per item)
      * bc: pick up item, move and drop (3)
      */
      if (objB === "floor"){ // possible that distance to "closest empty" stack should be calculated
        if (state.holding === objA){
          return 1;
        }
        let col : number = Interpreter.getColumn(state, objA);
        let yPos : number = Interpreter.getYPosition(state, objA);

        if (!yPos) return 0;

        let distanceToStack : number = Math.abs(state.arm - col);
        let emptyStack : number = (state.stacks[col].length - yPos - 1) * 4;

        return distanceToStack + emptyStack + drop + 3;
      }

      /*
      * If we're holding one of the objects:
      * If the object we want to put it on it on top, distance to stack + drop.
      * Else, put the held item next to stack (1 per move + 1 drop)
      * Empty the stack (4 per item)
      * Pick up. move and drop (3)
      */

      if (state.holding === objA || state.holding === objB){
        let held : string = state.holding;
        let notHeldCol : number = Interpreter.getColumn(state, (held === objA ? objB : objA));
        let notHeldYPos : number = Interpreter.getYPosition(state, (held === objA ? objB : objA));
        
        let distanceToStack : number = Math.abs(state.arm - notHeldCol);
        if (held === objA && notHeldYPos == state.stacks[notHeldCol].length){
          return distanceToStack + 1;
        }

        let emptyStack : number = (state.stacks[notHeldCol].length - notHeldYPos - 1) * 4;
        return distanceToStack + emptyStack + 4;
      }

      /*
      * Both in the same stack
      * Empty arm (0-1)
      * Move arm to stack (1 per move)
      * Move all items above the lower of them (4 per item)
      * Move A onto B (2 moves, pick up, drop up, 4 total)
      */

      var colA : number = Interpreter.getColumn(state, objA);
      var colB : number = Interpreter.getColumn(state, objB);

      var yPosA : number = Interpreter.getYPosition(state, objA);
      var yPosB : number = Interpreter.getYPosition(state, objB);

      if (colA == colB){
        if (yPosA - yPosB == 1) return 0;
        let initialArmMovements : number = Math.abs(state.arm - colA);
        let emptyStack : number = (state.stacks[colA].length - Math.min(yPosA, yPosB) - 1) * 4;
        return initialArmMovements + emptyStack + drop + 4;
      }

      /*
      * Empty arm (0-1)
      * Move arm to closet stack (1 per move)
      * Empty all items above in that stack (4 per item)
      * Pick it up, move it next to stack of other obejct, drop and go to stack (1 per distance + 2)
      * Empty other stack (4 per item)
      */
      
      let moveArmToStackA : number = Math.abs(state.arm - colA);
      let moveArmToStackB : number = Math.abs(state.arm - colB);
      let moveArmToClosestStack : number = Math.min(moveArmToStackA, moveArmToStackB);
      let emptyStacks : number = (state.stacks[colA].length - yPosA - 1 + 
          state.stacks[colB].length - yPosB - 1) * 4;
      let moveObjectBetweenStacks  : number = Math.abs(colB - colA) + 2;
      return moveArmToClosestStack + emptyStacks + moveObjectBetweenStacks + drop;
    }

    function calculateDistanceAbove(objA : string, objB : string, state : WorldState) : number {
      let drop = state.holding == null ? 0 : 1;

      if (objB === "floor") return drop;

      /*
      * If we're holding A
      * distance to stack with B, and put it ontop
      * If we're holding B
      * Place next to A (distance to stack + 1)
      * Empty items ontop of B (4 per item)
      * Move to A, pick up, move back, and drop (4)
      */
      if (state.holding === objA){
        let col = Interpreter.getColumn(state, objB);
        let distanceToStack : number = Math.abs(state.arm - col);
        return distanceToStack + 1;

      } else if (state.holding === objB){
        let col = Interpreter.getColumn(state, objA);
        let yPos = Interpreter.getYPosition(state, objA);
        
        let distanceToStack : number = Math.abs(state.arm - col);
        let emptyStack : number = (state.stacks[col].length - yPos - 1) * 4;
        return distanceToStack + emptyStack + 5;

      }

      /*
      * Empty arm
      * Move arm to A's stack
      * Empty all items above A
      * Move A to B's stack (pick up, 1 per distance, drop)
      */
      var colA : number = Interpreter.getColumn(state, objA);
      var colB : number = Interpreter.getColumn(state, objB);
      var yPosA : number = Interpreter.getYPosition(state, objA);
      var yPosB : number = Interpreter.getYPosition(state, objB);
      if (colA == colB && yPosA > yPosB) return 0;

      let initialArmMovement : number = Math.abs(state.arm - colA);
      let emptyStack : number = (state.stacks[colA].length - yPosA -1) * 4;
      let moveAtoB : number = Math.abs(colA - colB) + 2;
      return initialArmMovement + emptyStack + drop + moveAtoB;
    }

    function calculateDistanceBeside(objA : string, objB : string, state : WorldState) : number {
      if (Interpreter.beside(state, objA, objB)) return 0;

      /*
      * If we hold either:
      * Distance to the one step beside stack of other item, drop (distance - 1 + 1)
      * If distance is zero, move one and drop (2)
      */

      if (state.holding === objA || state.holding === objB){
        let held : string = state.holding;
        let notHeldCol : number = Interpreter.getColumn(state, (held === objA ? objB : objA));
        
        let distanceToStack : number = Math.abs(state.arm - notHeldCol);
        return distanceToStack == 0 ? 2 : distanceToStack;

      }

      /*
      * Empty the arm
      * For whichever is cheaper (A or B):
      * Move arm to the items stack (1 per distnce)
      * Move items above (4 per item)
      * Pick it up, move it to one step next to stack of other item and drop (1 + distance - 1 + 1)
      */

      var colA : number = Interpreter.getColumn(state, objA);
      var colB : number = Interpreter.getColumn(state, objB);

      var yPosA : number = Interpreter.getYPosition(state, objA);
      var yPosB : number = Interpreter.getYPosition(state, objB);

      if (Math.abs(colA - colB) == 1 ) return 0;

      let drop = state.holding == null ? 0 : 1;

      var initialArmMovementsToA : number = Math.abs(state.arm - colA);
      var emptyStackA : number = (state.stacks[colA].length - yPosA -1) * 4;
      var moveAToB : number = Math.abs(colA - colB) + 1;

      var initialArmMovementsToB : number = Math.abs(state.arm - colB);
      var emptyStackB : number = (state.stacks[colB].length - yPosB - 1) * 4;

      return Math.max(initialArmMovementsToA + emptyStackA, initialArmMovementsToB + emptyStackB) 
          + moveAToB + drop;
    }

    function calculateDistanceLeftOf(objA : string, objB : string, state : WorldState) : number {
      if (Interpreter.leftOf(state, objA, objB)) return 0;
      /*
      * If either is held:
      * If arm is on correct side, drop
      * Otherwise, move to the other side of the stack and drop (distance + 1 + 1)
      */
      if (state.holding === objA || state.holding === objB){
        let held : string = state.holding;
        let notHeldCol : number = Interpreter.getColumn(state, (held === objA ? objB : objA));
        
        if ((held === objA) && (state.arm < notHeldCol) ||
            (held === objB) && (state.arm > notHeldCol)) return 1;

        let distanceToStack : number = Math.abs(state.arm - notHeldCol);
        return distanceToStack + 2;

      }

      var colA : number = Interpreter.getColumn(state, objA);
      var colB : number = Interpreter.getColumn(state, objB);

      var yPosA : number = Interpreter.getYPosition(state, objA);
      var yPosB : number = Interpreter.getYPosition(state, objB);

      if (colA < colB) return 0;

      /*
      * Empty arm
      * Do whichever is cheaper (A or B):
      * Move arm to item
      * Move items above (4 per item)
      * Pick up, move to other side of stack of other item, drop (1 + distance + 1 + 1)
      */

      let drop = state.holding == null ? 0 : 1;

      var initialArmMovementsToA : number = Math.abs(state.arm - colA);
      var emptyStackA : number = (state.stacks[colA].length - yPosA - 1) * 4;
      var moveAToB : number = Math.abs(colA - colB) + 3;

      var initialArmMovementsToB : number = Math.abs(state.arm - colB);
      var emptyStackB : number = (state.stacks[colB].length - yPosB - 1) * 4;

      return Math.max(initialArmMovementsToA + emptyStackA, initialArmMovementsToB + emptyStackB) 
          + drop + moveAToB;
    }

    function calculateDistanceHolding(obj : string, state : WorldState) : number {
      if (state.holding === obj ) return 0;

      /*
      * Emmpty arm
      * Distance to stack (1 per distance)
      * Empty items above (4 per item)
      * Pick up (1)
      */

      let col = Interpreter.getColumn(state, obj);
      let yPos = Interpreter.getYPosition(state, obj);

      let drop = state.holding == null ? 0 : 1;

      var initialArmMovements : number = Math.abs(state.arm - col);
      var emptyStack : number = (state.stacks[col].length - yPos - 1) * 4;

      return initialArmMovements + emptyStack + drop + 1;
    }

}
