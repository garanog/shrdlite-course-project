///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="lib/collections.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
    Top-level function for the Interpreter. It calls `interpretCommand` for each
    * possible parse of the command. No need to change this one.
    * @param parses List of parses produced by the Parser.
    * @param currentState The current state of the world.
    * @returns Augments ParseResult with a list of interpretations. Each
    * interpretation is represented by a list of Literals.
    */
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult[] {
        var errors : Error[] = [];
        var interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                let result: InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation: DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
    * A Literal represents a relation that is intended to
    * hold among some objects.
    */
    export interface Literal {
        /** Whether this literal asserts the relation should hold
         * (true polarity) or not (false polarity). For example, we
         * can specify that "a" should *not* be on top of "b" by the
         * literal {polarity: false, relation: "ontop", args:
         * ["a","b"]}.
         */
        polarity : boolean;
        /** The name of the relation in question. */
        relation : string;
        /** The arguments to the relation. Usually these will be either objects
         * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result: InterpretationResult): string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit: Literal): string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    function stringifyDNF(formula: DNFFormula): string {
      return formula.map((literals) => {
          return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
          // return literals.map(stringifyLiteral).join(" & ");
      }).join(" | ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function. Interprets a command, as it has been
     * parsed by the parser into a DNF formula representing the goal of the
     * command.
     * @param cmd The actual command. Note that it is *not* a string, but rather
     * an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive
     * normal form (disjunction of conjunctions).
     */
    function interpretCommand(cmd: Parser.Command, state: WorldState): DNFFormula {
        switch(cmd.command) {
        case "move": // put, drop as well
          return interpretMoveCommand(cmd, state);
        case "take":
          return interpretTakeCommand(cmd, state);
        case "put":
          return interpretPutCommand(cmd, state);
        }
        return null;
    }

    function interpretMoveCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let setOfObjects = interpretEntity(cmd.entity, state);
      let relation = cmd.location.relation;
      let setOfLocationObjects = interpretEntity(cmd.location.entity, state);
      return combineSetsToDNF(state, setOfObjects, relation, setOfLocationObjects);
    }

    function interpretTakeCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let setOfObjects = interpretEntity(cmd.entity, state);
      let relation = "holding";
      return combineSetToDNF(setOfObjects, relation);
    }

    function interpretPutCommand(cmd: Parser.Command, state: WorldState) : DNFFormula {
      let setOfObjects: collections.LinkedList<string>;
      setOfObjects.add(state.holding) ; //set containing only this
      let relation = cmd.location.relation;
      let setOfLocationObjects = interpretEntity(cmd.location.entity, state);
      return combineSetsToDNF(state, setOfObjects, relation, setOfLocationObjects);
    }

    function interpretEntity(entity: Parser.Entity, state : WorldState){
      //TODO: interpret quantifier
      return interpretObject(entity.object, state);
    }

    function interpretObject(entityObject: Parser.Object, state: WorldState)
        : collections.LinkedList<string> {
      let objectMap  : { [s:string]: ObjectDefinition; } = state.objects;
      let stacks : Stack[]= state.stacks;
      let matchingSet : collections.LinkedList<string> =
          new collections.LinkedList<string>();

      if (entityObject.location == null) {
        //simple object

        let desiredSize  : string = entityObject.size;
        let desiredColor : string = entityObject.color;
        let desiredForm  : string = entityObject.form;

        console.log("df: ", desiredForm);
        if (desiredForm == "floor")
          matchingSet.add("floor");
        else {
          for (let stack of stacks) {
            for (let objectName of stack) {
               let objectToCompare : ObjectDefinition = objectMap[objectName];

              if ((desiredSize  == null || objectToCompare.size  == desiredSize) &&
                  (desiredColor == null || objectToCompare.color == desiredColor) &&
                  (desiredForm  == null || desiredForm == "anyform" || objectToCompare.form  == desiredForm)) {
                    matchingSet.add(objectName);
              }
            }
          }
        }
      } else {
        //complex object
        let originalObjects : collections.LinkedList<string> =
          interpretObject(entityObject.object, state);
        let relatedSet : collections.LinkedList<string> =
          interpretEntity(entityObject.location.entity, state);
        let relation : string = entityObject.location.relation;

        for (let originalObject of originalObjects.toArray()) {
          let correctlyPlaced : boolean = false;
          switch (relation) {
            case "ontop":
              correctlyPlaced = checkForCorrectPlace(onTopOf,state,originalObject,relatedSet);
              break;
            case "inside":
              correctlyPlaced = checkForCorrectPlace(inside,state,originalObject,relatedSet);
              break;
            case "above":
              correctlyPlaced = checkForCorrectPlace(above,state,originalObject,relatedSet);
              break;
            case "under":
              correctlyPlaced = checkForCorrectPlace(under,state,originalObject,relatedSet);
              break;
            case "beside":
              correctlyPlaced = checkForCorrectPlace(beside,state,originalObject,relatedSet);
              break;
            case "leftof":
              correctlyPlaced = checkForCorrectPlace(leftOf,state,originalObject,relatedSet);
              break;
            case "rightof":
              correctlyPlaced = checkForCorrectPlace(rightOf,state,originalObject,relatedSet);
              break;
            default:
              // code...
              break;
          }

          if (correctlyPlaced)
            matchingSet.add(originalObject);
        }
      }

      return matchingSet;
    }

    function checkForCorrectPlace(fun : (state : WorldState, a : string, b : string) => boolean,
        state: WorldState, obectName : string, relatedSet : collections.LinkedList<string>) : boolean {
      for (let comparingObject of relatedSet.toArray()) {
        if (fun(state,obectName,comparingObject))
          return true;
      }
      return false;
    }

    function combineSetsToDNF(state:WorldState, setOfObjects: collections.LinkedList<string>, theRelation: string, setOfLocationObjects: collections.LinkedList<string>) : DNFFormula  {
      // return all possible combinations of the objects and the locations
      let result : DNFFormula = [];
      //let result : DNFFormula = [[{polarity:null, relation:null, args:null}]];
      let objectSet = setOfObjects.toArray();
      let locationSet = setOfLocationObjects.toArray();
      for (let object of objectSet) {
        for (let location of locationSet) {
          if(checkPhysicalCorrectness(state, object, location, theRelation))
            result.push([{polarity:true, relation:theRelation, args:[object.toString(),location.toString()]}]);
        }
      }
      if (result.length == 0) result.push([{polarity:null, relation:null, args:null}]);
      console.log("DNFFormula ", stringifyDNF(result));
      return result;
    }

    function combineSetToDNF(setOfObjects: collections.LinkedList<string>, theRelation: string) : DNFFormula {
      // return all possible combinations of the objects and the relation
      let result : DNFFormula = [];
      let objectSet = setOfObjects.toArray();
      for (let object of objectSet) {
        result.push([{polarity:true, relation:theRelation, args:[object.toString()]}]);
      }
      if (result.length == 0) result.push([{polarity:null, relation:null, args:null}]);
      console.log("DNFFormula ", stringifyDNF(result));
      return result;
    }

    function checkPhysicalCorrectness(state : WorldState, a : string, b : string, relation : string) : boolean {
      let objectA = state.objects[a];
      let objectB = b == "floor" ? {color:null, size:"large", form:"floor"} : state.objects[b]; //TODO: really large?

      if(a == b) return false;                                                  // Objects cannot be related to themselves

      switch (relation) {
        case "ontop":
          //console.log("ontop check, ", objectA, objectB);
          if (objectA.form == "ball")                                           // Balls must be in boxes or on the floor, otherwise they roll away.
            if (objectB.form != "box" && objectB.form != "floor")
              return false;

          if (objectA.size == "large" && objectB.size == "small") return false; // Small objects cannot support large objects.
          if (objectB.form == "ball") return false;                             // Balls cannot support anything.
          if (objectB.form == "box") return false;                              // Objects are “inside” boxes, but “ontop” of other objects.

        break;

        case "inside":
          if (objectA.size == "large" && objectB.size == "small") return false; // Small objects cannot support large objects.
          if (objectB.form != "box") return false;                              // Objects are “inside” boxes, but “ontop” of other objects.
        break;

        case "under":
          if (objectA.size == "small" && objectB.size == "large") return false; // Small objects cannot support large objects.
          if (objectA.form == "ball") return false;                             // Balls cannot support anything.
        break;

        case "beside":
        break;

        case "above":
          // This one is not direct, but it is impossible anyway.
          if (objectA.size == "large" && objectB.size == "small") return false; // Small objects cannot support large objects.
        break;

        case "rightof":
        break;

        case "leftof":
        break;
      }

      return true;
    }

    /**
    --------------------------------------------------------------------
    TODO: in case these naiive implementations are not efficient enough,
    reimplement them mabbe using maps.
    TODO: the following functions should likely be moved somewhere else.
    */
    export function onTopOf(state : WorldState, a : string, b : string) : boolean {
      var aPos = getYPosition(state, a);
      var bPos = getYPosition(state, b);

      if (b == "floor")
        return aPos == 0;
      else
        return aPos != -1 && bPos != -1 && aPos == bPos + 1;
    }

    export function inside(state : WorldState, a : string, b : string) : boolean {
      // TODO: do we need both onTopOf and inside?
      return onTopOf(state, a, b);
    }

    export function above(state : WorldState, a : string, b : string) : boolean {
      var aPos = getYPosition(state, a);
      var bPos = getYPosition(state, b);
      if (b == "floor")
        return aPos != -1;
      else
        return aPos != -1 && bPos != -1 && aPos > bPos;
    }

    export function under(state : WorldState, a : string, b : string) : boolean {
        return above(state, b, a);
    }

    export function beside(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && Math.abs(aCol - bCol) == 1;
    }

    export function leftOf(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && aCol < bCol;
    }

    export function rightOf(state : WorldState, a : string, b : string) : boolean {
      var aCol = getColumn(state, a);
      var bCol = getColumn(state, b);
      return aCol != -1 && bCol != -1 && aCol > bCol;
    }

    /**
    @ returns The zero-based column the the object is in, or -1 if it's not
    part of the world.
    */
    function getColumn(state : WorldState, a : string) : number {
      if (state.objects[a] != null) {
        for (let s : number = 0; s < state.stacks.length; s++ ) {
            if (state.stacks[s].indexOf(a) > -1)
              return s;
        }
      }
      return -1;
    }

    /**
    @ returns The zero-based position (counted from the floor) in the stack
      the given object is located in, or -1 if it's not part of the world.
    */
    function getYPosition(state : WorldState, b : string) : number {
      var stack = getColumn(state, b);
      if (stack != -1)
        return state.stacks[stack].indexOf(b);
      else
        return -1;
    }
}
